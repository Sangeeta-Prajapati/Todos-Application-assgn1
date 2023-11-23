const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
const isValid = require("date-fns/isValid");
const format = require("date-fns/format");

app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriorityProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasDueDateProperty = (requestQuery) => {
  return requestQuery.dueDate !== undefined;
};

const isValidTodoPriority = (item) => {
  if (item === "HIGH" || item === "MEDIUM" || item === "LOW") {
    return true;
  } else {
    return false;
  }
};

const isValidTodoCategory = (item) => {
  if (item === "WORK" || item === "HOME" || item === "LEARNING") {
    return true;
  } else {
    return false;
  }
};

const isValidTodoStatus = (item) => {
  if (item === "TO DO" || item === "IN PROGRESS" || item === "DONE") {
    return true;
  } else {
    return false;
  }
};

const isValidToDoDueDate = (item) => {
  return isValid(new Date(item));
};

const convertDueDateToResponse = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

//......................API1......................

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
            SELECT * FROM todo
            WHERE 
            todo LIKE '%${search_q}%'
            AND status = '${status}'
            AND priority = '${priority}';`;
      if (isValidTodoPriority(priority) && isValidTodoStatus(status)) {
        data = await db.all(getTodosQuery);
        response.send(data.map((object) => convertDueDateToResponse(object)));
      } else if (isValidTodoPriority(priority)) {
        response.status(400);
        response.send("Invalid Todo Status");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasCategoryAndPriorityProperty(request.query):
      getTodosQuery = `
            SELECT * FROM todo
            WHERE 
            todo LIKE '%${search_q}%'
            AND priority = '${priority}'
            AND category = '${category}';`;
      if (isValidTodoCategory(category) && isValidTodoPriority(priority)) {
        data = await db.all(getTodosQuery);
        response.send(data.map((object) => convertDueDateToResponse(object)));
      } else if (isValidTodoCategory(category)) {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasCategoryAndStatusProperty(request.query):
      getTodosQuery = `
            SELECT * FROM todo
            WHERE 
            todo LIKE '%${search_q}%'
            AND status = '${status}'
            AND category = '${category}';`;
      if (isValidTodoCategory(category) && isValidTodoStatus(status)) {
        data = await db.all(getTodosQuery);
        response.send(data.map((object) => convertDueDateToResponse(object)));
      } else if (isValidTodoCategory(category)) {
        response.status(400);
        response.send("Invalid Todo Status");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasCategoryProperty(request.query):
      getTodosQuery = `
            SELECT * FROM todo
            WHERE 
            todo LIKE '%${search_q}%'
            AND category = '${category}';`;
      if (isValidTodoCategory(category)) {
        data = await db.all(getTodosQuery);
        response.send(data.map((object) => convertDueDateToResponse(object)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case hasPriorityProperty(request.query):
      getTodosQuery = `
            SELECT * FROM todo
            WHERE 
            todo LIKE '%${search_q}%'
            AND priority = '${priority}';`;
      if (isValidTodoPriority(priority)) {
        data = await db.all(getTodosQuery);
        response.send(data.map((object) => convertDueDateToResponse(object)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasStatusProperty(request.query):
      getTodosQuery = `
            SELECT * FROM todo
            WHERE 
            todo LIKE '%${search_q}%'
            AND status = '${status}';`;
      if (isValidTodoStatus(status)) {
        data = await db.all(getTodosQuery);
        response.send(data.map((object) => convertDueDateToResponse(object)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    default:
      getTodosQuery = `
            SELECT * FROM todo
            WHERE 
            todo LIKE '%${search_q}%';`;
      data = await db.all(getTodosQuery);
      response.send(data.map((object) => convertDueDateToResponse(object)));
  }
});

//                                 API2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT * FROM todo
    WHERE 
    id = ${todoId};`;
  const todoArray = await db.get(getTodoQuery);
  response.send(convertDueDateToResponse(todoArray));
});

//                             API3

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (date === undefined) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    if (isValidToDoDueDate(date)) {
      const formattedDate = format(new Date(date), "yyyy-MM-dd");
      const getTodoQuery = `
        SELECT * FROM todo
        WHERE 
        due_date = '${formattedDate}';`;

      const todo = await db.all(getTodoQuery);
      response.send(todo.map((object) => convertDueDateToResponse(object)));
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
});

//                       API4
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status, category, dueDate } = todoDetails;

  switch (false) {
    case isValidTodoPriority(priority):
      response.status(400);
      response.send("Invalid Todo Priority");
      break;
    case isValidTodoStatus(status):
      response.status(400);
      response.send("Invalid Todo Status");
      break;
    case isValidTodoCategory(category):
      response.status(400);
      response.send("Invalid Todo Category");
      break;
    case isValidToDoDueDate(dueDate):
      response.status(400);
      response.send("Invalid Due Date");
      break;
    default:
      const formattedDate = format(new Date(dueDate), "yyyy-MM-dd");
      const addTodoQuery = `
    INSERT INTO 
    todo (id , todo, priority , status, category, due_date )
    VALUES 
    (
        ${id}, '${todo}', '${priority}', '${status}', '${category}', '${formattedDate}');
    `;
      const dbResponse = await db.run(addTodoQuery);
      response.send("Todo Successfully Added");
      break;
  }
});

//                             API 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoDetails = request.body;
  const { todo, priority, status, dueDate, category } = todoDetails;
  switch (true) {
    case hasStatusProperty(request.body):
      const updateTodoStatusQuery = `
          UPDATE todo 
          SET
          status = '${status}'
          WHERE 
          id = ${todoId};`;
      if (isValidTodoStatus(status)) {
        await db.run(updateTodoStatusQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasCategoryProperty(request.body):
      const updateTodoCategoryQuery = `
          UPDATE todo 
          SET
          category = '${category}'
          WHERE 
          id = ${todoId};`;
      if (isValidTodoCategory(category)) {
        await db.run(updateTodoCategoryQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasPriorityProperty(request.body):
      const updateTodoPriorityQuery = `
          UPDATE todo 
          SET
          priority = '${priority}'
          WHERE 
          id = ${todoId};`;
      if (isValidTodoPriority(priority)) {
        await db.run(updateTodoPriorityQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasDueDateProperty(request.body):
      const updateTodoDueDateQuery = `
          UPDATE todo 
          SET
          due_date = '${dueDate}'
          WHERE 
          id = ${todoId};`;
      if (isValidToDoDueDate(dueDate)) {
        await db.run(updateTodoDueDateQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
    default:
      const updateTodoQuery = `
          UPDATE todo 
          SET
          todo = '${todo}'
          WHERE 
          id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;
  }
});

//                      API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    DELETE FROM todo 
    WHERE 
    id = '${todoId}';
    `;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});
module.exports = app;
