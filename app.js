const express = require('express'); 
const { MongoClient, ObjectId } = require('mongodb'); 
const cors = require('cors'); 
const path = require('path'); 
const app = express(); 
const port = 3000; 
 
const url = 'mongodb://localhost:27017/';
const dbName = 'employees';
const collectionName = 'employee_info';
 
let db; 

//function for connecting to database
async function connectToDatabase() { 
  const client = await MongoClient.connect(url);   
db = client.db(dbName); 
} 
 
app.use(express.json()); 
app.use(cors()); 
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//function to get all employees and return as an array
async function getEmployees(){
  try{
    if (!db){
      console.log('Database connection is not established yet.'); 
      return res.status(500).json({ error: 'Database connection is not ready.' }); 
    }
    //finds all records within employee_info and converts it to array
    const employees = await db.collection(collectionName).find().toArray();
    //returns array of employees
    return employees;
  } catch (error){
    res.status(500).json({ error: 'An error occurred while searching for the employee.' }); 
  }
}

//route for displaying the index page
app.get('/', (req, res) => { 
    getEmployees().then( //calls the getEmployees function and renders the index with the result 
    result => res.render('index', {result})); 
});

//route for editing a specific employee record 
app.get('/edit', async (req, res) => { 
  const empid = req.query.empid; 
  try {   
    if (!db) { 
      console.log('Database connection is not established yet.'); 
      return res.status(500).json({ error: 'Database connection is not ready.' }); 
    } 
    const employee = await db.collection(collectionName).findOne({ empid: empid }); 
    if (employee) { 
      //if employee is found within the mongodb collection, render update page with specific employee data
      console.log('Editing employee:', employee);
      return res.render('update', { employee });

    } else { 
      //if employee is not found
      console.log('No employee found with the provided empid.'); 
      res.status(404).send('No employee found with the provided empid.');
    } 
  } catch (err) { 
    console.error('Error searching for employee:', err); 
    res.status(500).send('Error searching for employee.');
  }
}); 

//route for displaying the add employee page
app.get('/add', (req, res) => {
  res.render('add');
});

//route for inserting an employee record into the collection
app.post('/insert', async (req, res) => { 
  //initialize empid at 0
  let empid = 0; 
  const { empname, position, department, salary } = req.body;   
  console.log('Received request body:', req.body); 
  //checks mongodb to see if there is an existing index within the collection
  //takes the last record within the collection
  const lastRecord = await db.collection(collectionName).find().limit(1).sort({$natural:-1}).toArray(); 
  if (lastRecord.length > 0){
    //if last record is found, parse the index's empid
   const lastEmpid = parseInt(lastRecord[0].empid);
   //auto-increment empid based on the last record's value
   empid = lastEmpid + 1;
 } 
  try { 
    if (!db) { 
      console.log('Database connection is not established yet.'); 
      return res.status(500).json({ error: 'Database connection is not ready.' }); 
    }
    //command to insert the employee data into the collection 
    await db.collection(collectionName).insertOne({       empid: empid.toString(),       empname,       position,       department,       salary, 
    }); 
 
    console.log('Record inserted successfully!'); 
    res.status(201).json({ message: 'Record inserted successfully!' }); 
  } catch (err) { 
    //trapping for insertion errors
    console.error('Error inserting record:', err); 
    res.status(500).json({ error: 'An error occurred while inserting the record.' });   } 
}); 
 
connectToDatabase() 
  .then(() => {     app.listen(port, () => { 
      console.log(`Server is running on http://localhost:${port}`); 
    }); 
  }) 
  .catch((err) => { 
    console.error('Error connecting to MongoDB:', err); 
  });
