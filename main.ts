// import inquirer from 'inquirer';
import { Employee } from './employees.js';
import { HolidayRequests, statusPending, statusApproved, statusRejected } from './holidayRequests.js';
import { HolidayRules } from './holidayRules.js';
import { format,areIntervalsOverlapping , formatDistance, formatRelative, isValid, isWeekend, eachDayOfInterval, differenceInDays, subDays } from 'date-fns';
import express, {Request, response, Response} from 'express';
import path from 'path';
import ejs from 'ejs';
import axios, { AxiosResponse } from 'axios';
import bodyParser  from 'body-parser';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import {RowDataPacket} from 'mysql2/promise';



import { MongoClient, Db } from 'mongodb';
import { config } from 'dotenv'


config()
const dbUrl:string = process.env.MONG_DB_URL as string;

// const client = new MongoClient(dbUrl);
// async function get_smthng() {
//     try {
//         // Assuming 'client' is already defined and initialized elsewhere in your code
//         await client.connect();
//         console.log('Connected successfully to server');
//
//         const db = client.db("app");
//         const collection = db.collection('documents');
//         const document = { name: "John", age: 30, city: "New York" };
//
//         const result = await collection.insertOne(document);
//         console.log('Found documents:', document);
//
//         // Don't forget to close the connection when you're done
//         await client.close();
//         console.log('Connection closed successfully');
//     } catch (error) {
//         console.error('Error:', error);
//     }
// }


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port:number = Number(process.env.PORT as string);
app.use(bodyParser.urlencoded());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Request Body:', req.body);
    next();
});

app.listen(port, () => {
    console.log(`Server started at ${port} port`);
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/*const employees: Employee[] = [];
employees.push({
    id: 1,
    name: "Yura",
    remainingHolidays: 14,
});
employees.push({
    id: 2,
    name: "Sveta",
    remainingHolidays: 14,
});
employees.push({
    id: 3,
    name: "Yaroslav",
    remainingHolidays: 15,
});
employees.push({
    id: 4,
    name: "Dima",
    remainingHolidays: 13,
});*/

//const approvedOrRejectedRequests: HolidayRequests[] = [];

//const employees:Employee[] = [];
//const requests: HolidayRequests[] = [];

//const rules: HolidayRules[] = [];
//const rule = new HolidayRules("2024-03-16", "2024-03-18");
//rules.push(rule);
let successMessage:string;
let failMessage:string;
// function arrayToObject(arr:[]) {
//     return arr.reduce((acc, currentValue, index) => {
//         acc[index] = currentValue;
//         return acc;
//     }, {});
// }
async function main(){
    // get_smthng()

    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: '',
        database: 'test'
    });

    // console.log(connection)

    // Виконання SQL-запиту для отримання списку таблиць
// // Виконання SQL-запиту для отримання списку таблиць
//     const [rows, fields] = await connection.execute(
//         'SELECT table_name FROM information_schema.tables WHERE table_schema = ?',
//         ['test']
//     );

    async function get_ids() {
        const [rows] = await connection.execute<any[]>('SELECT id FROM employees');

        // Повернення масиву з id
        return rows.map((row: any) => row.id);
    }

    //console.log(await get_ids())

// Вивід списку таблиць
//     console.log('Tables in the database:');
//     for (const row of rows as any[]) {
//         console.log(row.table_name);
//     }

    interface Holiday {
        date: string;
        localName: string;
        name: string;
        countryCode: string;
    }

    async function fetchHolidays(year: number, countryCode: string): Promise<Holiday[]> {
        try {
            const response: AxiosResponse<Holiday[]> = await axios.get<Holiday[]>(`https://date.nager.at/api/v3/publicholidays/${year}/${countryCode}`);
            return response.data;
        } catch (error) {
            console.error('An error occurred while executing the request:', error);
            return [];
        }
    }
    //const holidaysPromise: Promise<Holiday[]> = fetchHolidays(2024, 'UA');

    const holidays: Holiday[] = [];
    let relevantHolidays: Holiday[] = [];
    fetchHolidays(2024, 'UA')
        .then((holidaysData: Holiday[]) => {
            holidays.push(...holidaysData);
        })
        .catch((error) => {
            console.error('An error occurred while receiving holidays:', error);
        });


    async function checkDates(employeeId:number,startDate:string,endDate:string,){
        try {
            const rules = await getRulesRows();
            console.log(rules);
            const periodOfVacation = differenceInDays(endDate,startDate);
            console.log(periodOfVacation);
            const isHolidayOvarlappingWithBlackoutPeriod = !areIntervalsOverlapping({start:rules[0].blackoutStartDate,end:rules[0].blackoutEndDate},{start:startDate,end:endDate});
            
            const employee  = await connection.execute("SELECT * FROM employees WHERE employeeId = ?",[employeeId]);
            console.log("check empl" + employee);
            if(periodOfVacation>0 && differenceInDays(startDate,Date())>0){
                if(employee) {
                    // @ts-ignore
                    if(employee.remainingHolidays>=periodOfVacation){
                        if(isHolidayOvarlappingWithBlackoutPeriod) {
                            if(periodOfVacation<=rules[0].maxConsecutiveDays){
                                return true;
                            } else{
                                failMessage = "You chose too much days for your holiday!!!";
                                return false;
                            }
                        }else{
                            failMessage = "There is a Blackout Period in the dates you chose!!!";
                            return false;
                        }
                    }else{
                        failMessage = "You chose too much days for your holiday!!!";
                        return false;
                    }
                }else{
                    failMessage = "There is no employee with such id, please enter the correct eployee id!!!";
                    return false;
                }
            }else{
                failMessage = "You chose the wrong period of holiday!!!";
                return false;
            }

        } catch (error) {
            failMessage = "The date was entered incorrectly!!!";
            return false;
        }

    }



    async function getRequestsRows() {
        const [rows] = await connection.execute<RowDataPacket[]>('SELECT * FROM requests');
        const requestsJson = JSON.parse(JSON.stringify(rows));
        return requestsJson;
    }

    async function getApprovedOrRejectedRequestsRows() {
        const [rows] = await connection.execute<RowDataPacket[]>('SELECT * FROM approvedorrejectedholidays');
        const requestsJson = JSON.parse(JSON.stringify(rows));
        return requestsJson;
    }

    async function getEmployeeRows() {
        const [rows] = await connection.execute<RowDataPacket[]>('SELECT * FROM  employees');
        const employeesJson = JSON.parse(JSON.stringify(rows));
        return employeesJson;
    }

    async function getRulesRows() {
        const [rows] = await connection.execute<RowDataPacket[]>('SELECT * FROM rules');
        const rulesJson:HolidayRules[] = JSON.parse(JSON.stringify(rows));
        return rulesJson;
    }

    async function deleteRequestById(id:number) {

        try {
            const [result] = await connection.execute('DELETE FROM requests WHERE id = ?', [id]);
        } catch (error) {
            console.error('Error deleting request:', error);
        }
    }


    app.post('/delete-request', (req, res) => {
        try {

        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    });


    app.delete('/delete-request', (req, res) => {
        try {
            const requestId:number = Number(req.query.requestId);
            const result = req.query.result;
            if(result){
                deleteRequestById(requestId)
            }
            successMessage = "Holiday request deleted successfully!";
            res.redirect('/holidays');
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    });

    async function updateRequest(id: number, startDate: string, endDate: string) {

        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);

        async function checkRequestExists(idOfEmployee: number) {
            try {
                const [rows] = await connection.execute('SELECT * FROM requests WHERE employeeId = ?', [idOfEmployee]);

                // Перевіряємо, чи дані були отримані з бази даних та чи масив не є порожнім
                if (rows && Array.isArray(rows) && rows.length > 0) {
                    return true; // Якщо рядки знайдено, повертаємо true
                } else {
                    return false; // Якщо рядки не знайдено, повертаємо false
                }
            } catch (error) {
                console.error('Error checking request:', error);
                return false; // Повертаємо false в разі помилки
            }
        }

        if (isValid(startDateObj) && isValid(endDateObj) && checkRequestExists(id) !== undefined) {
            const formattedsStartDate = format(startDateObj, 'yyyy-MM-dd');
            const formattedsEndDate = format(endDateObj, 'yyyy-MM-dd');


            try {
                console.log("Виконую цю штуку")
                console.log(id)
                const [rows]:any = await connection.execute("SELECT id, employeeId, startDate, endDate, status FROM requests WHERE id = ?", [id])
                console.log("виконав")
                console.log("ОСЬО - " + rows)
            } catch (err) {
                console.log(err)
            }

            // if(checkDates(requests[id].employeeId, formattedsStartDate, formattedsEndDate)){
            //
            //     requests[id].startDate = formattedsStartDate;
            //     requests[id].endDate = formattedsEndDate;
            //     requests[id].status = statusPending;
            //     console.log("Win");
            //     return requests[id];
            // }
        }
    }




    app.post('/update-request', (req, res) => {
        const startDate:string = req.body.startDate;
        const endDate:string = req.body.endDate;
        const id = Number(req.body.idOfRequest as string);
        console.log(id)

        updateRequest(id,startDate,endDate);
        res.redirect('/holidays');
    });



    app.get('/update-request', (req, res) => {
        try {
            const idOfRequest: number = Number(req.query.requestId);
            res.render('update-request', { idOfRequest: idOfRequest});
        } catch (error) {
            res.status(500).send(error);
        }
    });



    app.get('/employees', async (req, res) => {
        try {
            const employeesJson = await getEmployeeRows();
            res.render('employees', { employeesJson});
        } catch (e) {
            res.status(500).send('Internal Server Error');
        }
    });

    app.get('/holidays', async (req, res) => {
        try {
            const requestsJson: HolidayRequests[] = await getRequestsRows();
            const approvedOrRejectedRequests: HolidayRequests[] = await getApprovedOrRejectedRequestsRows();

            relevantHolidays = [];
            const dates = requestsJson.map(request => {
                return {
                    startDate: request.startDate,
                    endDate: request.endDate
                };
            });

            holidays.forEach(holiday => {
                dates.forEach(date => {
                    if (areIntervalsOverlapping(
                        {start: new Date(holiday.date), end: new Date(holiday.date)},
                        {start: new Date(date.startDate), end: new Date(date.endDate)}
                    )) {
                        relevantHolidays.push(holiday);
                    }
                });
            });
            res.render('holidays', {requestsJson, approvedOrRejectedRequests, successMessage, relevantHolidays});
        } catch (error) {
            console.error('Error fetching requests:', error);
            res.status(500).send('Internal Server Error');
        }
    })


    app.post('/approve-reject-holiday', async (req, res) => {
        try {
            try {
                const idOfEmployee = parseInt(req.body.idOfEmployee);
                const action = req.body.action;
                const requestId = parseInt(req.body.requestId);

                const request = await connection.execute('SELECT * FROM requests WHERE id = ?', [requestId]);
                const [employeeRemainingHolidays] = await connection.execute('SELECT remainingHolidays FROM employees WHERE id = ?', [idOfEmployee]);
                const employeeRemainingHoliday = JSON.parse(JSON.stringify(employeeRemainingHolidays));
                const remainingHolidays = employeeRemainingHoliday[0].remainingHolidays;

                const [requestDates] = await connection.execute('SELECT startDate, endDate FROM requests WHERE id = ?', [requestId]);
                const requestBouthDates = JSON.parse(JSON.stringify(requestDates));
                const startDate = requestBouthDates[0].startDate;
                const endDate = requestBouthDates[0].endDate;
                const holidayLength = differenceInDays(endDate, startDate);
                const leftHolidays = remainingHolidays - holidayLength;

                if (request) {
                    if (action === 'approve') {
                        await connection.execute('UPDATE requests SET status = ? WHERE id = ?', ['Approved', requestId]);
                        await connection.execute('UPDATE employees SET remainingHolidays = ? WHERE id = ?', [leftHolidays, idOfEmployee]);

                        const [changedRequest] = await connection.execute('SELECT * FROM requests WHERE id = ?', [requestId]);
                        const changedParsedRequest = JSON.parse(JSON.stringify(changedRequest));
                        const statusOfChangedRequest:string = changedParsedRequest[0].status;

                        const sql = 'INSERT INTO approvedorrejectedholidays (employeeId, startDate, endDate, status) VALUES (?, ?, ?, ?)';
                        try {
                            const [result] = await connection.execute(sql, [idOfEmployee,startDate,endDate,statusOfChangedRequest]);
                            console.log('Request added successfully:', result);
                        } catch (error) {
                            console.error('Error adding request:', error);
                        }

                        await deleteRequestById(requestId);
                        successMessage = 'Holiday request approved successfully!'
                    } else if (action === 'reject') {
                        await connection.execute('UPDATE requests SET status = ? WHERE id = ?', ['Rejected', requestId]);

                        const [changedRequest] = await connection.execute('SELECT * FROM requests WHERE id = ?', [requestId]);
                        const changedParsedRequest = JSON.parse(JSON.stringify(changedRequest));
                        const statusOfChangedRequest:string = changedParsedRequest[0].status;

                        const sql = 'INSERT INTO approvedorrejectedholidays (employeeId, startDate, endDate, status) VALUES (?, ?, ?, ?)';
                        try {
                            const [result] = await connection.execute(sql, [idOfEmployee,startDate,endDate,statusOfChangedRequest]);
                            console.log('Request added successfully:', result);
                        } catch (error) {
                            console.error('Error adding request:', error);
                        }

                        await deleteRequestById(requestId);
                        successMessage = 'Holiday request rejected successfully!'
                    } else if (action === 'update') {
                        res.redirect(`/update-request?requestId=${requestId}`);
                    }
                    res.redirect('/holidays');
                } else {
                    res.status(404).send('Request not found');
                }
            } catch (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            }
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    });




    app.get('/add-holiday', async (req, res) => {
        try {
            const employeesJson = await getEmployeeRows();
            res.render('add-holiday', {failMessage, holidays, employeesJson});
        } catch (error) {
            res.status(500).send(error);
        }
    });
    app.post("/add-holiday", async (req, res) => {

        const employeeId = parseInt(req.body.employeeId as string);
        const startDate = req.body.startDate as string;
        const endDate = req.body.endDate as string;

        if( await checkDates(employeeId, startDate, endDate)){
            const sql = 'INSERT INTO requests (employeeId, startDate, endDate) VALUES (?, ?, ?)';
            try {
                const [result] = await connection.execute(sql, [employeeId,startDate,endDate]);
                console.log('Request added successfully:', result);
            } catch (error) {
                console.error('Error adding request:', error);
            }
            successMessage = "Holiday request created successfully!";
            res.redirect('/holidays');
        }else {
            res.redirect('/add-holiday');
        }
    });

}

main();