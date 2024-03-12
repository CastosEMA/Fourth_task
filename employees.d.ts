interface EmployeeData {
    id: number;
    name: string;
    remainingHolidays: number;
}
declare class Employee implements EmployeeData {
    id: number;
    name: string;
    remainingHolidays: number;
    constructor(id: number, name: string, remainingHolidays: number);
}
export { Employee, };
