import { useEffect, useState } from 'react';
import { toDocumentParams, } from './pdf-engine.js';
import { useLatest } from '../../utils/use-latest.js';
function createTextCache(pages) {
    const cache = new Map();
    return (pageIndex) => {
        const page = pages[pageIndex];
        if (!page)
            return Promise.reject(new RangeError(`No page ${pageIndex}`));
        const content = cache.get(pageIndex) ?? page.getTextContent();
        cache.set(pageIndex, content);
        return content;
    };
}
async function loadPdf({ source, loadEngine, workerSrc, documentOptions }, control) {
    const engine = await loadEngine();
    if (control.isCancelled)
        return null;
    if (workerSrc)
        engine.GlobalWorkerOptions.workerSrc = workerSrc;
    const task = engine.getDocument({ ...documentOptions, ...toDocumentParams(source) });
    control.task = task;
    task.onPassword = (update, reason) => control.onPassword(update, reason === engine.PasswordResponses.INCORRECT_PASSWORD);
    const document = await task.promise;
    const [pages, outline] = await Promise.all([
        Promise.all(Array.from({ length: document.numPages }, (_, index) => document.getPage(index + 1))),
        document.getOutline().catch(() => null),
    ]);
    const sizes = pages.map((page) => {
        const { width, height } = page.getViewport({ scale: 1 });
        return { width, height };
    });
    return {
        engine,
        document,
        pages,
        outline: outline ?? [],
        rotation: 0,
        sizes,
        getTextContent: createTextCache(pages),
        getViewport: createViewportCache(pages, 0),
    };
}
function toError(cause) {
    return cause instanceof Error ? cause : new Error(String(cause));
}
/** A URL object as its text, so a new `URL` for the same address is the same document. */
function toLoadSource(source) {
    return source instanceof URL ? source.href : source;
}
function isCurrent(key, source, attempt) {
    return key?.source === source && key.attempt === attempt;
}
/** The password request of a load: counts the passwords turned down and marks one being checked. */
function createPasswordHandler(key, control, setPassword) {
    let failures = 0;
    return (update, isIncorrect) => {
        if (control.isCancelled)
            return;
        if (isIncorrect)
            failures += 1;
        const submit = (password) => {
            setPassword((previous) => previous && { ...previous, isChecking: true });
            update(password);
        };
        setPassword(() => ({ ...key, failures, isChecking: false, submit }));
    };
}
/** The rotation a page shows at: its own, turned further by the reader's, in degrees. */
export function toPageRotation(page, rotation) {
    return (((page.rotate + rotation) % 360) + 360) % 360;
}
/**
 * Viewports at the reader's rotation. Only the applied scale is worth keeping: every part of a page
 * asks for the same one.
 */
export function createViewportCache(pages, rotation) {
    const cache = new Map();
    let cachedScale = Number.NaN;
    return (pageIndex, scale) => {
        if (scale !== cachedScale) {
            cache.clear();
            cachedScale = scale;
        }
        const page = pages[pageIndex];
        const viewport = cache.get(pageIndex) ??
            page?.getViewport({ scale, rotation: toPageRotation(page, rotation) });
        if (viewport)
            cache.set(pageIndex, viewport);
        return viewport;
    };
}
/**
 * Opens `source` with the injected engine and keeps it open until the source changes or the viewer
 * unmounts, when the engine's loading task (and its worker) is destroyed. A `null` source stays
 * loading. A new array is a new document; a URL, as text or a `URL`, is the same document while its
 * address is. A document that needs its password waits for it.
 */
export function usePdfDocument(options) {
    const source = toLoadSource(options.source);
    const [attempt, setAttempt] = useState(0);
    const [result, setResult] = useState(null);
    const [password, setPassword] = useState(null);
    const latest = useLatest(options);
    useEffect(() => {
        if (source === null)
            return undefined;
        const key = { source, attempt };
        const control = { isCancelled: false, task: null, onPassword: () => undefined };
        control.onPassword = createPasswordHandler(key, control, setPassword);
        loadPdf({ ...latest.current, ...key }, control).then((loaded) => {
            if (!control.isCancelled && loaded)
                setResult({ ...key, loaded });
        }, (cause) => {
            if (control.isCancelled)
                return;
            setResult({ ...key, loaded: null });
            latest.current.onError?.(toError(cause));
        });
        return () => {
            control.isCancelled = true;
            void control.task?.destroy();
        };
    }, [source, attempt, latest]);
    const current = isCurrent(result, source, attempt) ? result : null;
    const request = !current && isCurrent(password, source, attempt) ? password : null;
    let status = request ? 'password' : 'loading';
    if (current)
        status = current.loaded ? 'ready' : 'error';
    return {
        status,
        loaded: current?.loaded ?? null,
        password: request,
        retry: () => setAttempt((count) => count + 1),
    };
}
//# sourceMappingURL=use-pdf-document.js.map