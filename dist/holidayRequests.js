class holidayRequests {
    constructor(emploeeId, startDate, endDate, status = "Pending") {
        this.employeeId = emploeeId;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status;
    }
}
export { holidayRequests, };
//const request = new holidayRequests(1, "2024-04-01", "2024-04-15", "Pending");