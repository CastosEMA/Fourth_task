type requestStatus = "Pending" | "Approved" | "Rejected";
interface holidayRequestsData {
    employeeId: number;
    startDate: string;
    endDate: string;
    status: requestStatus;
}
declare class holidayRequests implements holidayRequestsData {
    employeeId: number;
    startDate: string;
    endDate: string;
    status: requestStatus;
    constructor(emploeeId: number, startDate: string, endDate: string, status?: requestStatus);
}
export { holidayRequests, };
