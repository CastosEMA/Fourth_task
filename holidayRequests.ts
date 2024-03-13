type requestStatus = "Pending" | "Approved" | "Rejected";

interface holidayRequestsData {
    employeeId: number; // assign an id of emploee
    startDate: string;
    endDate: string;
    status: requestStatus;
}

class HolidayRequests implements holidayRequestsData{
    employeeId: number; // assign an id of emploee
    startDate: string;
    endDate: string;
    status: requestStatus; //set a "pending" status as default

    constructor(emploeeId: number, startDate: string, endDate: string, status: requestStatus = "Pending"){
        this.employeeId = emploeeId;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status;
    }
}

export {
    HolidayRequests,
}

//const request = new holidayRequests(1, "2024-04-01", "2024-04-15", "Pending");
