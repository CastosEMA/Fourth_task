interface holidayRulesData {
    maxConsecutiveDays: number;
    blackoutStartDate: string;
    blackoutEndDate: string;
}

class holidayRules implements holidayRulesData{
    maxConsecutiveDays: number;
    blackoutStartDate: string;
    blackoutEndDate: string;

    constructor(maxConsecutiveDays: number, blackoutStartDate: string, blackoutEndDate: string){
        this.maxConsecutiveDays = maxConsecutiveDays;
        this.blackoutStartDate = blackoutStartDate;
        this.blackoutEndDate = blackoutEndDate;
    }
}

export{
    holidayRules,
}

