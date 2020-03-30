var string = "13:45:00"
var string2 = "24:45:00"
var appointmentLength = 15
console.log(new Date())

var value1 = parseInt(string.slice(0, 2))*100 + parseInt(string.slice(3, 5))

var value2 = parseInt(string2.slice(0, 2))*100 + parseInt(string2.slice(3, 5))
var days = []
var today = new Date();
var someDate = new Date();
someDate.setDate(someDate.getDate() + 1); 
var appointments = []
var i = 0

var Difference_In_Time =  someDate.getTime()- today.getTime(); 
  

var Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24); 

  


console.log(Difference_In_Days)



    while((value2 - value1) > appointmentLength){
    appointments.push({time : value1,
    patient : null})

    value1 = value1 + appointmentLength;

}
console.log(appointments)


while(Difference_In_Days > 0){
    days.push({date : today.getTime(),
        times : appointments
    })
    today.setDate(today.getDate + 1)
    Difference_In_Days = Difference_In_Days - 1
}

console.log(days)