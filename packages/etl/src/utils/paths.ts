import path from 'path';

const basePath = path.join(import.meta.dir, '..', '..', '..', '..', 'output');

export const paths = {
    csv: path.join(basePath, 'csv'),
    data: path.join(basePath, 'data'),
    emailPackage: path.join(basePath, '..', 'packages', 'email'),
    files: path.join(basePath, 'files'),
    developer: path.join(basePath, 'downloads', 'developer'),
    download: path.join(basePath, 'downloads'),
    json: path.join(basePath, 'json'),
    logs: path.join(basePath, 'logs'),
    metadata: path.join(basePath, 'metadata'),
    sql: path.join(basePath, 'sql'),
};

export { path };
