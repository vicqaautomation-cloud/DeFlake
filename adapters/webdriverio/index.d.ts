import { Services } from '@wdio/types';

/**
 * DeFlake WebdriverIO Service
 * 
 * Automatically captures failed tests and suggests fixes using DeFlake Cloud AI.
 */
declare class DeFlakeWDIOService implements Services.ServiceInstance {
    constructor(options?: any);
    afterTest(test: any, context: any, result: any): Promise<void>;
}

export = DeFlakeWDIOService;
