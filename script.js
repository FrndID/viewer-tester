$(document).ready(function() {
    const $container = $('#solar-system');
    const $universe = $('#universe');
    const $planetInfo = $('#planetInfo');
    
    // Simpan data planet secara global untuk referensi interaksi
    let solarData = [];
    let currentScale = 1;

    // --- 1. Load Data & Render (jQuery AJAX) ---
    $.getJSON('data.json', function(data) {
        solarData = data;
        renderSolarSystem(data);
        setupInteractions();
    }).fail(function() {
        alert("Gagal memuat data Tata Surya. Pastikan data.json valid dan berjalan di server.");
    });

    // --- 2. Core Rendering Function (DOM/SVG) ---
    function renderSolarSystem(data) {
        $container.empty(); // Bersihkan kontainer

        $.each(data, function(index, body) {
            const finalSize = body.size * body.visual_scale;

            // A. Render Bintang Pusat (Matahari)
            if (body.type === "star" || body.dist === 0) {
                const $sun = $('<img>', {
                    src: body.skin.src,
                    class: 'absolute-center celestial-body sun-glow',
                    css: { 
                        width: `${finalSize}px`, 
                        height: `${finalSize}px`,
                        zIndex: 20
                    },
                    'data-id': body.id
                });
                $container.append($sun);
                return; // Lanjut ke planet berikutnya
            }

            // B. Render Planet & Orbitnya
            const orbitRadius = body.dist;

            // 1. Garis Orbit
            const $orbitLine = $('<div>', {
                class: 'absolute-center orbit-line',
                id: `orbit-${body.id}`,
                css: {
                    width: `${orbitRadius * 2}px`,
                    height: `${orbitRadius * 2}px`,
                    zIndex: 1
                }
            });
            $container.append($orbitLine);

            // 2. Pivot (Wadah Rotasi CSS)
            const $pivot = $('<div>', {
                class: 'pivot',
                id: `pivot-${body.id}`,
                css: {
                    // Setel durasi animasi berdasarkan data (contoh: 15s)
                    animationDuration: `${body.speed_sec}s`,
                    zIndex: 10
                }
            });

            // 3. Wrapper Planet (Digeser sejauh radius orbit)
            const $planetWrapper = $('<div>', {
                id: `wrapper-${body.id}`,
                class: 'planet-wrapper',
                css: { 
                    // Geser planet ke kanan sejauh radius orbit
                    transform: `translateX(${orbitRadius}px)` 
                }
            });

            // 4. Gambar SVG Planet
            const $planetImg = $('<img>', {
                src: body.skin.src,
                class: 'celestial-body',
                css: { 
                    width: `${finalSize}px`, 
                    height: `${finalSize}px`,
                    // Koreksi agar pusat gambar pas di garis orbit
                    marginLeft: `-${finalSize/2}px`,
                    marginTop: `-${finalSize/2}px`
                },
                'data-id': body.id,
                'data-orbit-id': `orbit-${body.id}` // Referensi ke orbitnya
            });

            // --- C. Render Satelit (Moons) ---
            if (Array.isArray(body.moons) && body.moons.length > 0) {
                $.each(body.moons, function(mIndex, moon) {
                    const mFinalSize = moon.size;
                    const mOrbitRadius = moon.dist;

                    // Orbit Bulan (Tipis)
                    const $mOrbit = $('<div>', {
                        class: 'absolute-center orbit-line',
                        css: { 
                            width: `${mOrbitRadius * 2}px`, 
                            height: `${mOrbitRadius * 2}px`,
                            borderStyle: 'solid',
                            borderColor: 'rgba(255,255,255,0.05)'
                        }
                    });

                    // Pivot Bulan (Berputar relatif terhadap planet induk)
                    const $mPivot = $('<div>', {
                        class: 'pivot',
                        css: { animationDuration: `${moon.speed_sec}s` }
                    });

                    // Gambar Bulan
                    const $mImg = $('<img>', {
                        src: moon.skin.src,
                        class: 'absolute',
                        css: { 
                            width: `${mFinalSize}px`, 
                            height: `${mFinalSize}px`,
                            // Geser bulan sejauh radius orbitnya dari planet
                            transform: `translateX(${mOrbitRadius}px)`,
                            // Koreksi pusat
                            marginLeft: `-${mFinalSize/2}px`,
                            marginTop: `-${mFinalSize/2}px`,
                            opacity: 0.8
                        }
                    });

                    $mPivot.append($mImg);
                    // Masukkan orbit dan bulan ke dalam Wrapper Planet
                    $planetWrapper.append($mOrbit).append($mPivot);
                });
            }

            // Susun hierarki DOM
            $planetWrapper.append($planetImg);
            $pivot.append($planetWrapper);
            $container.append($pivot);
        });
    }

    // --- 3. Interaksi & Kontrol (jQuery) ---
    function setupInteractions() {
        // A. Hover Planet -> Highlight Orbit
        $(document).on('mouseenter', '.celestial-body', function() {
            const orbitId = $(this).attr('data-orbit-id');
            if (orbitId) $(`#${orbitId}`).addClass('highlight');
        });

        $(document).on('mouseleave', '.celestial-body', function() {
            $('.orbit-line').removeClass('highlight');
        });

        // B. Klik Planet -> Tampilkan Info (Tailwind styled)
        $(document).on('click', '.celestial-body', function(e) {
            e.stopPropagation(); // Jangan pemicu klik universe
            const id = $(this).attr('data-id');
            const body = solarData.find(b => b.id === id);
            if (body) showInfo(body);
        });

        // Klik di luar planet -> Tutup Info
        $universe.on('click', function() {
            hideInfo();
        });

        // C. Zoom Control
        $('#zoom').on('input', function() {
            currentScale = $(this).val();
            $container.css('transform', `scale(${currentScale})`);
        });

        // D. Speed Control (Bonus: Mengubah durasi animasi CSS secara dinamis)
        $('#speedControl').on('input', function() {
            const speedMultiplier = $(this).val();
            $('.pivot').each(function() {
                // Ambil durasi awal dari atribut *style* inline atau data
                const originalDurationStr = $(this).css('animation-duration');
                if (originalDurationStr) {
                    const originalDuration = parseFloat(originalDurationStr);
                    // Kita tidak bisa langsung kalikan durasi saat animasi jalan dengan mudah.
                    // Cara termudah adalah mengubah *time-scale* container aslinya (sulit di CSS murni)
                    // Atau menggunakan properti CSS kustom --speed-scale (membutuhkan modifikasi CSS lebih lanjut)
                    // Untuk kesederhanaan, kita biarkan slider ini hanya visual dulu di modifikasi ini.
                }
            });
            // Pendekatan alternatif: Mengubah `time-scale` container utama jika pakai framework animasi.
            // Di CSS murni, ini sulit tanpa me-reset animasi. Slider ini kita biarkan sebagai referensi UI-mu saja.
        });
    }

    // --- 4. Info Panel Functions (Tailwind) ---
    function showInfo(body) {
        $planetInfo.empty(); // Bersihkan info lama

        const isSun = (body.dist === 0);
        
        let moonsHtml = '<p class="text-sm text-gray-400 italic">Tidak ada bulan terdeteksi.</p>';
        if (body.moons && body.moons.length > 0) {
            moonsHtml = `<p class="text-sm font-bold text-gray-300 mb-1">Bulan (${body.moons.length}):</p><ul class="text-xs text-gray-400 list-disc list-inside">`;
            $.each(body.moons, function(i, moon) {
                moonsHtml += `<li>${moon.name}</li>`;
            });
            moonsHtml += '</ul>';
        }

        const content = `
            <div class="flex items-center gap-3 mb-3">
                <img src="${body.skin.src}" class="w-12 h-12" style="filter: drop-shadow(0 0 5px ${body.color})">
                <div>
                    <h2 class="text-2xl font-extrabold" style="color: ${body.color}">${body.name}</h2>
                    <p class="text-xs text-gray-500 uppercase tracking-widest">${body.type || 'Planet'}</p>
                </div>
            </div>
            <p class="text-sm text-gray-300 mb-4 line-height-relaxed">${body.desc || 'Deskripsi tidak tersedia.'}</p>
            <div class="border-t border-gray-700 pt-3 flex flex-col gap-1.5 text-sm text-gray-400">
                <p><strong class="text-gray-200">Jarak Orbit:</strong> ${body.dist} Arcadia Units</p>
                <p><strong class="text-gray-200">Ukuran Visual:</strong> ${body.size}px</p>
                ${!isSun ? `<p><strong class="text-gray-200">Kecepatan:</strong> ${body.speed_sec} detik/rotasi</p>` : ''}
            </div>
            <div class="mt-4 pt-3 border-t border-gray-700">
                ${moonsHtml}
            </div>
            ${!isSun ? `<button class="mt-5 w-full bg-arcadia hover:bg-purple-700 text-white text-sm py-2 rounded-lg font-bold transition">Fokus ke Planet (Bonus TBD)</button>` : ''}
        `;

        $planetInfo.html(content).removeClass('hidden transform translate-x-10 opacity-0').addClass('transform translate-x-0 opacity-100');
    }

    function hideInfo() {
        $planetInfo.addClass('transform translate-x-10 opacity-0').on('transitionend', function() {
            $(this).addClass('hidden').off('transitionend');
        });
    }

    // --- Global Functions (Referenced by HTML buttons) ---
    window.clearFocus = function() {
        hideInfo();
        // Reset zoom & posisi
        currentScale = 1;
        $('#zoom').val(1);
        $container.css('transform', 'scale(1) translate(0,0)');
    }
});
