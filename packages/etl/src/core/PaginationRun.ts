import { APIResponse } from '../types';
import { logger } from '../utils/logger';

const noop = () => null;

export default class PaginationRun<T> {
    protected logger = logger;
    protected processedItems = 0;

    public async dryRun(
        act: {
            fetchData: (page: number, pageSize: number) => any;
            name?: string;
            processItem: <T = any>(item: T, index: number) => any;
            processFinished?: () => any;
        },
        pagination: { page: number; pageSize: number },
    ) {
        const { fetchData, name, processItem, processFinished = noop } = act;
        const { page, pageSize } = pagination;
        const logName = `[dryRun:${name ?? 'default'}]`;

        const response = await fetchData(page, pageSize);

        const { items, ...productResponse } = response as APIResponse;

        logger.info(
            `${logName} processing page: ${productResponse.page}/${productResponse.lastPage}`,
        );

        let index = 0;
        for (const item of items) {
            await processItem(item, index);

            index++;
            this.processedItems++;
        }

        if (productResponse.page === productResponse.lastPage) {
            logger.info(`${logName} processed items ` + this.processedItems);
            logger.info(`${logName} processed pages ` + page);

            await processFinished();

            return;
        }

        await this.dryRun(act, { page: page + 1, pageSize });
    }

    protected async fetchData(page: number, pageSize: number): Promise<T> {
        throw new Error('Implementation needed');
    }

    protected async processItem(item: T, index: number) {
        throw new Error('Implementation needed');
    }

    protected async processFinished() {}

    public async run(page = 1, pageSize = 20) {
        const response = await this.fetchData(page, pageSize);

        const { items, ...productResponse } = response as APIResponse;

        logger.info(
            `Start Processing - Page: ${productResponse.page}/${productResponse.lastPage}`,
        );

        let index = 0;
        for (const item of items) {
            await this.processItem(item, index);

            this.processedItems++;
            index++;
        }

        if (productResponse.page === productResponse.lastPage) {
            logger.info('Processed Items' + this.processedItems);

            await this.processFinished();

            return;
        }

        await this.run(page + 1, pageSize);
    }
}
