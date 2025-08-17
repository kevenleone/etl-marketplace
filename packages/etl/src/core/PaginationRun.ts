import { APIResponse } from '../types';
import { logger } from '../utils/logger';

export default class PaginationRun<T> {
    protected logger = logger;
    protected processedItems = 0;

    constructor() {
        logger.info(`Starting the process ${this.constructor.name}`);
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

        console.time('process items');

        let index = 0;
        for (const item of items) {
            await this.processItem(item, index);

            this.processedItems++;
            index++;
        }

        console.timeEnd('process items');

        if (productResponse.page === productResponse.lastPage) {
            logger.info('Processed Items', this.processedItems);

            await this.processFinished();

            return;
        }

        await this.run(page + 1, pageSize);
    }
}
