$(document).ready(function() {
    const BASE_ORBIT_RADIUS = 60; 
    let isPaused = false;

    $.getJSON('data.json', function(data) {
        const sys = data.solar_system;
        const $container = $('#solar-system');

        const sunSize = sys.star.size * sys.star.visual_scale;
        const $sun = $('<img>', {
            src: sys.star.skin.src,
            class: 'absolute-center sun-glow celestial-body',
            css: { width: `${sunSize}px`, height: `${sunSize}px`, zIndex: 10 },
            'data-name': sys.star.name
        });
        $container.append($sun);

        $.each(sys.planets, function(index, planet) {
            const orbitRadius = planet.order * BASE_ORBIT_RADIUS;
            const finalSize = planet.size * planet.visual_scale;

            const $orbitLine = $('<div>', {
                class: 'absolute-center orbit-line',
                id: `orbit-${planet.id}`,
                css: {
                    width: `${orbitRadius * 2}px`,
                    height: `${orbitRadius * 2}px`,
                    zIndex: 1
                }
            });
            $container.append($orbitLine);

            const $pivot = $('<div>', {
                class: 'pivot',
                css: {
                    width: '0px', 
                    height: '0px',
                    animationDuration: `${planet.speed}s`,
                    zIndex: 5
                }
            });

            const $planetWrapper = $('<div>', {
                id: `wrapper-${planet.id}`,
                class: 'planet-wrapper absolute',
                css: { transform: `translateX(${orbitRadius}px)` } 
            });

            const $planetImg = $('<img>', {
                src: planet.skin.src,
                class: 'celestial-body',
                css: { width: `${finalSize}px`, height: `${finalSize}px` },
                'data-name': planet.name,
                'data-parent-orbit': `orbit-${planet.id}`
            });

            $planetWrapper.append($planetImg);
            $pivot.append($planetWrapper);
            $container.append($pivot);
        });

        $.each(sys.satellites, function(index, satellite) {
            const parentWrapperId = `#wrapper-${satellite.planet_id}`;
            const $parentWrapper = $(parentWrapperId);

            if ($parentWrapper.length) {
                const satOrbitRadius = satellite.order * 25; 
                const finalSize = satellite.size * satellite.visual_scale;

                const $satOrbitLine = $('<div>', {
                    class: 'absolute-center orbit-line',
                    css: { width: `${satOrbitRadius * 2}px`, height: `${satOrbitRadius * 2}px` }
                });

                const $satPivot = $('<div>', {
                    class: 'pivot',
                    css: { width: '0px', height: '0px', animationDuration: `${satellite.speed}s` }
                });

                const $satImg = $('<img>', {
                    src: satellite.skin.src,
                    class: 'celestial-body absolute',
                    css: { 
                        width: `${finalSize}px`, 
                        height: `${finalSize}px`,
                        transform: `translateX(${satOrbitRadius}px)`
                    },
                    'data-name': satellite.name
                });

                $satPivot.append($satImg);
                $parentWrapper.append($satOrbitLine).append($satPivot);
            }
        });

        setupInteractions();
    });

    function setupInteractions() {
        const $tooltip = $('#tooltip');
        const $tooltipName = $('#tooltip-name');

        $(document).on('mouseenter', '.celestial-body', function(e) {
            const name = $(this).attr('data-name');
            const parentOrbitId = $(this).attr('data-parent-orbit');
            
            $tooltipName.text(name);
            $tooltip.removeClass('hidden');

            if (parentOrbitId) {
                $(`#${parentOrbitId}`).addClass('highlight');
            }
        });

        $(document).on('mousemove', '.celestial-body', function(e) {
            $tooltip.css({
                top: e.pageY + 15 + 'px',
                left: e.pageX + 15 + 'px'
            });
        });

        $(document).on('mouseleave', '.celestial-body', function() {
            $tooltip.addClass('hidden');
            $('.orbit-line').removeClass('highlight');
        });

        $('#btn-toggle').click(function() {
            isPaused = !isPaused;
            if (isPaused) {
                $('body').addClass('paused');
                $(this).text('▶ Play').removeClass('bg-blue-600').addClass('bg-green-600');
            } else {
                $('body').removeClass('paused');
                $(this).text('⏸ Pause').removeClass('bg-green-600').addClass('bg-blue-600');
            }
        });

        $('#zoom').on('input', function() {
            const scaleValue = $(this).val();
            $('#universe').css('transform', `scale(${scaleValue})`);
        });
    }
});