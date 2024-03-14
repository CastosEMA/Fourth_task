import { HolidayRequests, statusPending, statusApproved, statusRejected } from './holidayRequests.js';
import { HolidayRules } from './holidayRules.js';
import { format, areIntervalsOverlapping, isValid, differenceInDays } from 'date-fns';
import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;
app.use(bodyParser.urlencoded());
app.listen(port, () => {
    console.log(`Server started at ${port} port`);
});
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
const employees = [];
employees.push({
    id: 1,
    name: "Yura",
    remainingHolidays: 12,
});
employees.push({
    id: 2,
    name: "Sveta",
    remainingHolidays: 14,
});
employees.push({
    id: 3,
    name: "Yaroslav",
    remainingHolidays: 14,
});
const requests = [];
requests.push({
    employeeId: 1,
    startDate: "2024-04-01",
    endDate: "2024-04-15",
    status: statusPending,
});
const rules = [];
const rule = new HolidayRules("2024-03-16", "2024-03-18");
rules.push(rule);
// function arrayToObject(arr:[]) {
//     return arr.reduce((acc, currentValue, index) => {
//         acc[index] = currentValue;
//         return acc;
//     }, {});
// }
function main() {
    //let updateResponse: object;
    function checkDates(employeeId, startDate, endDate) {
        try {
            const periodOfVacation = differenceInDays(endDate, startDate);
            const isHolidayOvarlappingWithBlackoutPeriod = !areIntervalsOverlapping({ start: rules[0].blackoutStartDate, end: rules[0].blackoutEndDate }, { start: startDate, end: endDate });
            const employee = employees.find((emp) => emp.id === employeeId);
            console.log(startDate);
            if (periodOfVacation > 0 && differenceInDays(startDate, Date()) > 0) {
                if (employee) {
                    if (employee.remainingHolidays >= periodOfVacation) {
                        if (isHolidayOvarlappingWithBlackoutPeriod) {
                            if (periodOfVacation <= rules[0].maxConsecutiveDays) {
                                return true;
                            }
                            else {
                                console.log("You chose too much days for your holiday!!!");
                                return false;
                            }
                        }
                        else {
                            console.log("There is a Blackout Period in the dates you chose!!!");
                            return false;
                        }
                    }
                    else {
                        console.log("You chose too much days for your holiday!!!");
                        return false;
                    }
                }
                else {
                    console.log("There is no employee with such id, please enter the correct eployee id!!!");
                    return false;
                }
            }
            else {
                console.log("You chose the wrong period of holiday!!!");
                return false;
            }
        }
        catch (error) {
            console.log("The date was entered incorrectly");
            return false;
            // res.status(500).send(error);
        }
    }
    function updateRequest(id, startDate, endDate) {
        console.log(startDate + " " + endDate);
        console.log(id);
        console.log(typeof id);
        console.log(requests[id]);
        // Перетворюємо рядки з датами у об'єкти Date
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        console.log(startDateObj);
        console.log(endDateObj);
        // Перевіряємо, чи є обидві дати дійсними
        if (isValid(startDateObj) && isValid(endDateObj) && requests[id] !== undefined) {
            const formattedsStartDate = format(startDateObj, 'yyyy-MM-dd');
            const formattedsEndDate = format(endDateObj, 'yyyy-MM-dd');
            requests[id].startDate = formattedsStartDate;
            requests[id].endDate = formattedsEndDate;
            requests[id].status = statusPending;
            console.log(startDateObj + " " + endDateObj);
            console.log("Перемога");
            console.log(requests[id]);
            return requests[id];
        }
    }
    app.post('/update-request', (req, res) => {
        console.log(req.body);
        const startDate = req.body.startDate;
        const endDate = req.body.endDate;
        const id = Number(req.body.idOfRequest); //Витягнути requestId з вибраного реквеста
        console.log(id);
        //const updatingRequest = requests.find((r) => r.employeeId === id);
        updateRequest(id, startDate, endDate);
    });
    app.get('/update-request', (req, res) => {
        try {
            const idOfRequest = Number(req.query.requestId);
            console.log(idOfRequest);
            res.render('update-request', { idOfRequest: idOfRequest });
        }
        catch (error) {
            res.status(500).send(error);
        }
    });
    app.get('/employees', (req, res) => {
        try {
            const employeesJson = JSON.stringify(employees);
            console.log(req);
            res.render('employees', { employees: JSON.parse(employeesJson) });
        }
        catch (e) {
            res.status(500).send('Internal Server Error');
        }
    });
    app.get('/holidays', (req, res) => {
        try {
            res.render('holidays', { requests });
        }
        catch (e) {
            res.status(500).send('Internal Server Error');
        }
    });
    app.post('/approve-reject-holiday', (req, res) => {
        try {
            const idOfEmployee = parseInt(req.body.idOfEmployee);
            const action = req.body.action;
            const requestId = parseInt(req.body.requestId);
            console.log(requestId);
            const request = requests.find((r) => r.employeeId === idOfEmployee);
            if (request) {
                if (action === 'approve') {
                    request.status = statusApproved;
                }
                else if (action === 'reject') {
                    request.status = statusRejected;
                }
                else if (action === 'update') {
                    res.redirect(`/update-request?requestId=${requestId}`);
                }
                res.redirect('/holidays');
            }
            else {
                res.status(404).send('Request not found');
            }
        }
        catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    });
    app.post("/add-holiday", (req, res) => {
        const employeeId = parseInt(req.body.employeeId);
        const startDate = req.body.startDate;
        const endDate = req.body.endDate;
        if (checkDates(employeeId, startDate, endDate) == true) {
            requests.push(new HolidayRequests(employeeId, startDate, endDate));
            res.redirect('/add-holiday');
        }
        else {
            res.redirect('/add-holiday');
        }
    });
    // Get the form page to add a new holiday request
    app.get('/add-holiday', (req, res) => {
        try {
            res.render('add-holiday');
        }
        catch (error) {
            res.status(500).send(error);
        }
    });
}
/*async function addEmployee() {
    const { id, name, remainingHolidays } = await inquirer.prompt([
        {
            type: 'input',
            name: 'id',
            message: 'Enter the id of the new empoyee',
        },
        {
            type: 'input',
            name: 'name',
            message: 'Enter the name of the new employee:',
        },
        {
            type: 'number',
            name: 'remainingHolidays',
            message: 'Enter the remaining holidays for the new employee:',
        },
    ]);

    employees.push(new Employee(id, name, remainingHolidays));
    console.log('New employee added successfully!');
}

// View of the list of added Employees
function viewEmployees() {
    console.log('List of employees:');
    employees.forEach( (emp) => {
        console.log(`${emp.id} ${emp.name}: ${emp.remainingHolidays} days remaining holidays`);
    });
}

//Submit Holiday Request
async function submitHolidayRequest() {
    const { employeeId, startDate, endDate, status } = await inquirer.prompt([
        {
            type: 'list',
            name: 'employeeId',
            message: 'Choose the employee:',
            choices: employees.map((employee) => employee.id),
        },
        {
            type: 'input',
            name: 'startDate',
            message: 'Enter the start date of the holiday (YYYY-MM-DD):',
        },
        {
            type: 'input',
            name: 'endDate',
            message: 'Enter the end date of the holiday (YYYY-MM-DD):',
        },
    ]);
    function parseDate(input: string): Date {
        const parts = input.split('-');
        return new Date(+parts[0], +parts[1], +parts[2]);
    }

    // Check Blackout period function
    if(areIntervalsOverlapping({start:rules[0].blackoutStartDate,end:rules[0].blackoutEndDate},{start:startDate,end:endDate})){
        console.log("The requested holiday period falls within the blackout period.");
        return;
    }else{
        console.log("The requested holiday period is outside the blackout period.");

    }

    const daysRequested = differenceInDays(
        parseDate(endDate),
        parseDate(startDate)
    )

    // Check Max Consecutive days function
    if (daysRequested > rules[0].maxConsecutiveDays //|| daysRequested > employees[employeeId].remainingHolidays) {
        console.log(`Request exceeds the maximum consecutive holiday limit of ${rules[0].maxConsecutiveDays} days.`);
        return;
    }
    const employee = employees.find((emp) => emp.id === employeeId);
    if (employee) {
        if(daysRequested > employee.remainingHolidays){
            console.log('This employee does not have this much holidays!');
        }else{
            requests.push( new HolidayRequests (employeeId, startDate, endDate, status));
            console.log('Holiday request submitted successfully!');
        }
    } else {
        console.log('Employee not found!');
    }
}

// View Pending Holiday Requests
function viewPendingHolidayRequests() {
    console.log('List of pending holiday requests:');
    requests.filter((request) => request.status === 'Pending').forEach((request) => {
        console.log(`${request.employeeId}: Start date ${request.startDate} to End date ${request.endDate} - ${request.status}`);
    });
}

//Approving or Reject Request
async function approveRejectHolidayRequest() {

    const pendingRequests = requests.filter((request) => request.status === 'Pending');

    if (pendingRequests.length === 0) {
        console.log('No pending holiday requests.');
        return;
    }

    const { requestToProcess } = await inquirer.prompt([
        {
            type: 'list',
            name: 'requestToProcess',
            message: 'Choose a pending holiday request to approve or reject:',
            choices: pendingRequests.map((request) => `${request.employeeId}: Start date ${request.startDate} - End date ${request.endDate}`),
        },
    ]);

    const selectedRequest = pendingRequests.find(
        (request) =>
            `${request.employeeId}: Start date ${request.startDate} - End date ${request.endDate}` === requestToProcess
    );

    if (selectedRequest) {
        const { approve } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'approve',
                message: 'Do you want to approve this holiday request?',
                default: true,
            },
        ]);

        if (approve) {
            selectedRequest.status = 'Approved';
            console.log('Holiday request approved!');
        } else {
            selectedRequest.status = 'Rejected';
            console.log('Holiday request rejected!');
        }
    }

}
*/
main();
