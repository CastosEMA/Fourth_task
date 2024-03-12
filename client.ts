import axios, {Axios} from 'axios';



async function approveHoliday(employeeId,status) {
    try {
        const params= {
            "employeeId":employeeId,
            "status":status
        }
        const response = await axios.get('http://localhost:5002/approveholiday',{params});

        return response.data;
    } catch (error) {
        return null;
    }
}

async  function addHoliday(employeeId, startDate, endDate){
    try {
        const params ={
            "employeeId": employeeId,
            "startDate":startDate,
            "endDate":endDate,
        }
        const response = await axios.post(
            'http://localhost:5002/add-holiday', {params});
        return response.data;

    } catch (error){
        console.log(`Error: ${error}`);
        return null;
    }
}

async function employees() {
    try {
        const response = await axios.get('http://localhost:5002/employees');
        return response;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

/*async function holidays() {
    try {
        const response = await axios.get('http://localhost:5002/holidays');
        // console.log(response.data)
        return response;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}*/

// holidays().then(response => {
//     if (response) {
//         console.log(response.data);
//     } else {
//         console.log('Failed to fetch data');
//     }
// });

// approveHoliday(12, "Approved")
//     .then(result => {
//         console.log(result);
//     })
//     .catch(error => {
//         console.error(error);
//     });
/*holidays().then(response => {
    if (response) {
        console.log(response.data);
    } else {
        console.log('Failed to fetch data');
    }
});*/

export{
    addHoliday,
}