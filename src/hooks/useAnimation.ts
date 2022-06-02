type appendAttributes = {
    percentage: number;
    step: number;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    outerAnimation: Array<string>;
    innerAnimation: Array<string>;
};

const append = ({
    percentage,
    step,
    startX,
    startY,
    endX,
    endY,
    outerAnimation,
    innerAnimation,
}: appendAttributes): void => {
    const xScale: number = parseFloat(
        (startX + (endX - startX) * step).toFixed(5)
    );
    const yScale: number = parseFloat(
        (startY + (endY - startY) * step).toFixed(5)
    );

    const invScaleX = (1 / xScale).toFixed(5);
    const invScaleY = (1 / yScale).toFixed(5);

    outerAnimation.push(`
    ${percentage}% {
        transform: scale(${xScale}, ${yScale});
    }`);

    innerAnimation.push(`
    ${percentage}% {
        transform: scale(${invScaleX}, ${invScaleY});
    }`);
};

const _clamp = (value: number, min: number, max: number): number => {
    return Math.max(min, Math.min(max, value));
};

const ease = (v: number, pow: number = 4): number => {
    v = _clamp(v, 0, 1);

    return 1 - Math.pow(1 - v, pow);
};

type dimensions = {
    x: number;
    y: number;
};

export const createEaseAnimations = (
    animationStart: dimensions,
    animationEnd: dimensions,
    animationName: string,
    nFrames = 90
): void => {
    let menuEase = document.querySelector(animationName);
    if (menuEase) {
        return;
    }

    menuEase = document.createElement('style');
    menuEase.classList.add(animationName);

    const animation: Array<string> = [];
    const contentsAnimation: Array<string> = [];

    const percentIncrement = 100 / nFrames;

    for (let i = 0; i <= nFrames; i++) {
        const step = parseFloat(ease(i / nFrames).toFixed(5));
        const percentage = parseFloat((i * percentIncrement).toFixed(5));
        const startX = animationStart.x;
        const startY = animationStart.y;
        const endX = animationEnd.x;
        const endY = animationEnd.y;

        append({
            percentage,
            step,
            startX,
            startY,
            endX,
            endY,
            outerAnimation: animation,
            innerAnimation: contentsAnimation,
        });
    }

    menuEase.textContent = `
    @keyframes ${animationName}Animation {
        ${animation.join('')}
    }

    @keyframes ${animationName}ContentsAnimation {
        ${contentsAnimation.join('')}
    }`;

    document.head.appendChild(menuEase);
};
