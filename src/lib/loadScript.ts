export function loadScript(src: string)
{
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;

        document.body.appendChild(script);

        script.addEventListener('load', () => resolve(script));
        script.addEventListener('error', () => reject(script));
    });
}