import inquirer from 'inquirer';
import { Employee } from './employees.ts';
import { holidayRequests } from './holidayRequests.ts';
import { holidayRules } from './holidayRules.ts';
import { format,areIntervalsOverlapping , formatDistance, formatRelative, isValid, isWeekend, eachDayOfInterval, differenceInDays, subDays } from 'date-fns';
import express from 'express';
import path from 'path';
import ejs from 'ejs';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const port = 5002;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const employees: Employee[] = [];
employees.push({
    id: 1,
    name: "Yura",
    remainingHolidays: 12,
});

const requests: holidayRequests[] = [];
requests.push({
    employeeId: 1,
    startDate: "2024-04-01",
    endDate: "2024-04-15",
    status: "Pending"
});
/*function arrayToObject(arr) {
    return arr.reduce((acc, currentValue, index) => {
        acc[index] = currentValue;
        return acc;
    }, {});
}*/

const rules: holidayRules[] = [];
rules.push(new holidayRules(14, "2024-03-16", "2024-03-18"));

    async function main(){

        app.get('/employees', (req, res) => {
            try {
                // Get the list of employees in JSON format
                const employeesJson = JSON.stringify(employees);

                // Sending the list of employees to the page
                res.render('employees', { employees: JSON.parse(employeesJson) });
            } catch (e) {
                res.status(500).send('Internal Server Error');
            }
        });
        app.get('/holidays', (req, res) => {
            try {
                // Get a list of vacation requests in JSON format
                const requestsJson = JSON.stringify(requests);

                // Sending a list of leave requests to the page
                res.render('holidays', { requests: JSON.parse(requestsJson) });
            } catch (e) {
                res.status(500).send('Internal Server Error');
            }
        });

        app.get('/add-holiday', async (req, res) => {
            try {
                /*const employeeId = parseInt(req.query.employeeId);
                const startDate = req.query.startDate;
                const endDate = req.query.endDate;

                const request = new holidayRequests(employeeId, startDate, endDate);
                requests.push(request);*/

                // Render HTML using EJS and transfer data
                res.render('add-holiday', {
                    /*employeeId: request.employeeId,
                    startDate: request.startDate,
                    endDate: request.endDate,
                    status: request.status,*/
                });

            } catch (e) {
                res.send(e);
            }
        });

        app.listen(port, () => {
            console.log(`Сервер запущено на порті ${port}`);
        });
    }

    //add a new Employee
    async function addEmployee() {
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
        if (daysRequested > rules[0].maxConsecutiveDays /*|| daysRequested > employees[employeeId].remainingHolidays*/) {
          console.log(`Request exceeds the maximum consecutive holiday limit of ${rules[0].maxConsecutiveDays} days.`);
          return;
        }
        const employee = employees.find((emp) => emp.id === employeeId);
        if (employee) {
            if(daysRequested > employee.remainingHolidays){
                console.log('This employee does not have this much holidays!');
            }else{
                requests.push( new holidayRequests (employeeId, startDate, endDate, status));
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


main();
      