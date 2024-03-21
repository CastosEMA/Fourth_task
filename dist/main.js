var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { format, areIntervalsOverlapping, isValid, differenceInDays } from 'date-fns';
import express from 'express';
import path from 'path';
import axios from 'axios';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { config } from 'dotenv';
config();
const dbUrl = process.env.MONG_DB_URL;
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
const port = Number(process.env.PORT);
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
let successMessage;
let failMessage;
// function arrayToObject(arr:[]) {
//     return arr.reduce((acc, currentValue, index) => {
//         acc[index] = currentValue;
//         return acc;
//     }, {});
// }
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // get_smthng()
        const connection = yield mysql.createConnection({
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
        function get_ids() {
            return __awaiter(this, void 0, void 0, function* () {
                const [rows] = yield connection.execute('SELECT id FROM employees');
                // Повернення масиву з id
                return rows.map((row) => row.id);
            });
        }
        function fetchHolidays(year, countryCode) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const response = yield axios.get(`https://date.nager.at/api/v3/publicholidays/${year}/${countryCode}`);
                    return response.data;
                }
                catch (error) {
                    console.error('An error occurred while executing the request:', error);
                    return [];
                }
            });
        }
        //const holidaysPromise: Promise<Holiday[]> = fetchHolidays(2024, 'UA');
        const holidays = [];
        let relevantHolidays = [];
        fetchHolidays(2024, 'UA')
            .then((holidaysData) => {
            holidays.push(...holidaysData);
        })
            .catch((error) => {
            console.error('An error occurred while receiving holidays:', error);
        });
        function checkDates(employeeId, startDate, endDate) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const rules = yield getRulesRows();
                    const periodOfVacation = differenceInDays(endDate, startDate);
                    const isHolidayOvarlappingWithBlackoutPeriod = !areIntervalsOverlapping({ start: rules[0].blackoutStartDate, end: rules[0].blackoutEndDate }, { start: startDate, end: endDate });
                    const employee = yield connection.execute("SELECT * FROM employees WHERE employeeId = ?", [employeeId]);
                    console.log("check empl" + employee);
                    if (periodOfVacation > 0 && differenceInDays(startDate, Date()) > 0) {
                        if (employee) {
                            // @ts-ignore
                            if (employee.remainingHolidays >= periodOfVacation) {
                                if (isHolidayOvarlappingWithBlackoutPeriod) {
                                    if (periodOfVacation <= rules[0].maxConsecutiveDays) {
                                        return true;
                                    }
                                    else {
                                        failMessage = "You chose too much days for your holiday!!!";
                                        return false;
                                    }
                                }
                                else {
                                    failMessage = "There is a Blackout Period in the dates you chose!!!";
                                    return false;
                                }
                            }
                            else {
                                failMessage = "You chose too much days for your holiday!!!";
                                return false;
                            }
                        }
                        else {
                            failMessage = "There is no employee with such id, please enter the correct eployee id!!!";
                            return false;
                        }
                    }
                    else {
                        failMessage = "You chose the wrong period of holiday!!!";
                        return false;
                    }
                }
                catch (error) {
                    failMessage = "The date was entered incorrectly!!!";
                    return false;
                }
            });
        }
        function getRequestsRows() {
            return __awaiter(this, void 0, void 0, function* () {
                const [rows] = yield connection.execute('SELECT * FROM requests');
                const requestsJson = JSON.parse(JSON.stringify(rows));
                return requestsJson;
            });
        }
        function getApprovedOrRejectedRequestsRows() {
            return __awaiter(this, void 0, void 0, function* () {
                const [rows] = yield connection.execute('SELECT * FROM approvedorrejectedholidays');
                const requestsJson = JSON.parse(JSON.stringify(rows));
                return requestsJson;
            });
        }
        function getEmployeeRows() {
            return __awaiter(this, void 0, void 0, function* () {
                const [rows] = yield connection.execute('SELECT * FROM  employees');
                const employeesJson = JSON.parse(JSON.stringify(rows));
                return employeesJson;
            });
        }
        function getRulesRows() {
            return __awaiter(this, void 0, void 0, function* () {
                const [rows] = yield connection.execute('SELECT * FROM rules');
                const rulesJson = JSON.parse(JSON.stringify(rows));
                return rulesJson;
            });
        }
        function deleteRequestById(id) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const [result] = yield connection.execute('DELETE FROM requests WHERE id = ?', [id]);
                }
                catch (error) {
                    console.error('Error deleting request:', error);
                }
            });
        }
        app.post('/delete-request', (req, res) => {
            try {
            }
            catch (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            }
        });
        app.delete('/delete-request', (req, res) => {
            try {
                const requestId = Number(req.query.requestId);
                const result = req.query.result;
                if (result) {
                    deleteRequestById(requestId);
                }
                successMessage = "Holiday request deleted successfully!";
                res.redirect('/holidays');
            }
            catch (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            }
        });
        function updateRequest(id, startDate, endDate) {
            return __awaiter(this, void 0, void 0, function* () {
                const startDateObj = new Date(startDate);
                const endDateObj = new Date(endDate);
                function checkRequestExists(idOfEmployee) {
                    return __awaiter(this, void 0, void 0, function* () {
                        try {
                            const [rows] = yield connection.execute('SELECT * FROM requests WHERE employeeId = ?', [idOfEmployee]);
                            // Перевіряємо, чи дані були отримані з бази даних та чи масив не є порожнім
                            if (rows && Array.isArray(rows) && rows.length > 0) {
                                return true; // Якщо рядки знайдено, повертаємо true
                            }
                            else {
                                return false; // Якщо рядки не знайдено, повертаємо false
                            }
                        }
                        catch (error) {
                            console.error('Error checking request:', error);
                            return false; // Повертаємо false в разі помилки
                        }
                    });
                }
                if (isValid(startDateObj) && isValid(endDateObj) && checkRequestExists(id) !== undefined) {
                    const formattedsStartDate = format(startDateObj, 'yyyy-MM-dd');
                    const formattedsEndDate = format(endDateObj, 'yyyy-MM-dd');
                    try {
                        console.log("Виконую цю штуку");
                        console.log(id);
                        const [rows] = yield connection.execute("SELECT id, employeeId, startDate, endDate, status FROM requests WHERE id = ?", [id]);
                        console.log("виконав");
                        console.log("ОСЬО - " + rows);
                    }
                    catch (err) {
                        console.log(err);
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
            });
        }
        app.post('/update-request', (req, res) => {
            const startDate = req.body.startDate;
            const endDate = req.body.endDate;
            const id = Number(req.body.idOfRequest);
            console.log(id);
            updateRequest(id, startDate, endDate);
            res.redirect('/holidays');
        });
        app.get('/update-request', (req, res) => {
            try {
                const idOfRequest = Number(req.query.requestId);
                res.render('update-request', { idOfRequest: idOfRequest });
            }
            catch (error) {
                res.status(500).send(error);
            }
        });
        app.get('/employees', (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const employeesJson = yield getEmployeeRows();
                res.render('employees', { employeesJson });
            }
            catch (e) {
                res.status(500).send('Internal Server Error');
            }
        }));
        app.get('/holidays', (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const requestsJson = yield getRequestsRows();
                const approvedOrRejectedRequests = yield getApprovedOrRejectedRequestsRows();
                relevantHolidays = [];
                const dates = requestsJson.map(request => {
                    return {
                        startDate: request.startDate,
                        endDate: request.endDate
                    };
                });
                holidays.forEach(holiday => {
                    dates.forEach(date => {
                        if (areIntervalsOverlapping({ start: new Date(holiday.date), end: new Date(holiday.date) }, { start: new Date(date.startDate), end: new Date(date.endDate) })) {
                            relevantHolidays.push(holiday);
                        }
                    });
                });
                res.render('holidays', { requestsJson, approvedOrRejectedRequests, successMessage, relevantHolidays });
            }
            catch (error) {
                console.error('Error fetching requests:', error);
                res.status(500).send('Internal Server Error');
            }
        }));
        app.post('/approve-reject-holiday', (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                try {
                    const idOfEmployee = parseInt(req.body.idOfEmployee);
                    const action = req.body.action;
                    const requestId = parseInt(req.body.requestId);
                    const request = yield connection.execute('SELECT * FROM requests WHERE id = ?', [requestId]);
                    const [employeeRemainingHolidays] = yield connection.execute('SELECT remainingHolidays FROM employees WHERE id = ?', [idOfEmployee]);
                    const employeeRemainingHoliday = JSON.parse(JSON.stringify(employeeRemainingHolidays));
                    const remainingHolidays = employeeRemainingHoliday[0].remainingHolidays;
                    const [requestDates] = yield connection.execute('SELECT startDate, endDate FROM requests WHERE id = ?', [requestId]);
                    const requestBouthDates = JSON.parse(JSON.stringify(requestDates));
                    const startDate = requestBouthDates[0].startDate;
                    const endDate = requestBouthDates[0].endDate;
                    const holidayLength = differenceInDays(endDate, startDate);
                    const leftHolidays = remainingHolidays - holidayLength;
                    if (request) {
                        if (action === 'approve') {
                            yield connection.execute('UPDATE requests SET status = ? WHERE id = ?', ['Approved', requestId]);
                            yield connection.execute('UPDATE employees SET remainingHolidays = ? WHERE id = ?', [leftHolidays, idOfEmployee]);
                            const [changedRequest] = yield connection.execute('SELECT * FROM requests WHERE id = ?', [requestId]);
                            const changedParsedRequest = JSON.parse(JSON.stringify(changedRequest));
                            const statusOfChangedRequest = changedParsedRequest[0].status;
                            const sql = 'INSERT INTO approvedorrejectedholidays (employeeId, startDate, endDate, status) VALUES (?, ?, ?, ?)';
                            try {
                                const [result] = yield connection.execute(sql, [idOfEmployee, startDate, endDate, statusOfChangedRequest]);
                                console.log('Request added successfully:', result);
                            }
                            catch (error) {
                                console.error('Error adding request:', error);
                            }
                            yield deleteRequestById(requestId);
                            successMessage = 'Holiday request approved successfully!';
                        }
                        else if (action === 'reject') {
                            yield connection.execute('UPDATE requests SET status = ? WHERE id = ?', ['Rejected', requestId]);
                            const [changedRequest] = yield connection.execute('SELECT * FROM requests WHERE id = ?', [requestId]);
                            const changedParsedRequest = JSON.parse(JSON.stringify(changedRequest));
                            const statusOfChangedRequest = changedParsedRequest[0].status;
                            const sql = 'INSERT INTO approvedorrejectedholidays (employeeId, startDate, endDate, status) VALUES (?, ?, ?, ?)';
                            try {
                                const [result] = yield connection.execute(sql, [idOfEmployee, startDate, endDate, statusOfChangedRequest]);
                                console.log('Request added successfully:', result);
                            }
                            catch (error) {
                                console.error('Error adding request:', error);
                            }
                            yield deleteRequestById(requestId);
                            successMessage = 'Holiday request rejected successfully!';
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
            }
            catch (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            }
        }));
        app.get('/add-holiday', (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const employeesJson = yield getEmployeeRows();
                res.render('add-holiday', { failMessage, holidays, employeesJson });
            }
            catch (error) {
                res.status(500).send(error);
            }
        }));
        app.post("/add-holiday", (req, res) => __awaiter(this, void 0, void 0, function* () {
            const employeeId = parseInt(req.body.employeeId);
            const startDate = req.body.startDate;
            const endDate = req.body.endDate;
            if (yield checkDates(employeeId, startDate, endDate)) {
                const sql = 'INSERT INTO requests (employeeId, startDate, endDate) VALUES (?, ?, ?)';
                try {
                    const [result] = yield connection.execute(sql, [employeeId, startDate, endDate]);
                    console.log('Request added successfully:', result);
                }
                catch (error) {
                    console.error('Error adding request:', error);
                }
                successMessage = "Holiday request created successfully!";
                res.redirect('/holidays');
            }
            else {
                res.redirect('/add-holiday');
            }
        }));
    });
}
main();
