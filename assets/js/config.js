export const Config = {
    API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://127.0.0.1:8787' 
        : 'https://ecity-enquiry-worker.deepuavm.workers.dev'
};
