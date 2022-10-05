let express= require('express');
let app= express();
const exphbs=require('express-handlebars');
const flash= require('express-flash');
const session= require('express-session');
const bodyParser = require('body-parser');
const ShortUniqueId=require('short-unique-id')
const uid = new ShortUniqueId({ length: 5 })
const pgp = require('pg-promise')({});
const DailyExpense= require('./daily')
app.use(express.static('public'));

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://expenser:expenser123@localhost:5432/trackdb";

// create database trackdb;
// create role expenser login password 'expenser123';
// grant all privileges on database trackdb to expenser;

app.engine('handlebars', exphbs.engine({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.use(express.urlencoded({extended: false}))
app.use(express.json())

app.use(session({
   secret: 'this is my longest string that is used to test my daily expenses with db app for browser',
   resave: false,
   saveUninitialized: true
}));


const config = {
    connectionString: DATABASE_URL
}

if (process.env.NODE_ENV == 'production') {
    config.ssl = {
        rejectUnauthorized: false
    }
}
app.use(flash());

const db = pgp(config);
const dailyExpenses = DailyExpense(db);


app.get('/', function(req, res){

    res.render('index', )
})

app.post('/register', async function(req, res){
    const name= req.body.fname;
    const sname= req.body.sname;
    const email= req.body.email;
    const code= uid();

    await dailyExpenses.setNames(name, sname, email, uid());
    req.flash('success', code)
    res.render("login")
})

app.get('/login', async function (req, res){

    const {username}= req.body

    if (username){
    const code= uid()
    req.flash('success', 'User was added, use this code' + code)
    
} else{
    req.flash('error', 'No username provided')
}
res.redirect("/expenses/name")

})

app.get('/expenses/:name', async function(req, res){
    const catagory_id= req.body.value;
    const amount= req.body.amount
    const expense_date= req.body.expense_date
    let result= await dailyExpenses.getExpense( catagory_id, amount, expense_date)
    res.render('categories', {
        categories: await dailyExpenses.getCategories(),
        name: req.params.name
    })
})

app.post('/expenses/:name', async function(req, res){
    const catagory_id= req.body.catagory;
    const amount= req.body.amount
    const expense_date= req.body.expense_date
    const name = req.params.name
    let result= await dailyExpenses.setExpense(catagory_id, amount, expense_date)
    req.flash('success', 'Expense submitted!');

    res.redirect('back')
})



app.get('/total', async function(req, res){
    let result= await dailyExpenses.showAll()
    let totalExpense= await dailyExpenses.getTotal()
    let totals= `Total: R${totalExpense}`
    
    res.render('total',{
            expenseCatagory: result,
            totalSpending: totals
    })
    
})

let PORT = process.env.PORT || 1643
app.listen(PORT, function(){
    console.log('App starting on port', PORT);
})