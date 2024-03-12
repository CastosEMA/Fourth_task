interface holidayRulesData {
    maxConsecutiveDays: number;
    blackoutStartDate: string;
    blackoutEndDate: string;
}
declare class holidayRules implements holidayRulesData {
    maxConsecutiveDays: number;
    blackoutStartDate: string;
    blackoutEndDate: string;
    constructor(maxConsecutiveDays: number, blackoutStartDate: string, blackoutEndDate: string);
}
export { holidayRules, };
