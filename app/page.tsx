"use client";

import React from "react";
import { init, tx, id } from "@instantdb/react";
import { format, parseISO } from 'date-fns';

// ID for app: multiplayer-chat-app
const APP_ID = "eabc8046-5610-4100-8bf0-61fbf2fe34c2";

// Optional: Declare your schema for intellisense!
type Schema = {
  todos: Todo;
};

const db = init<Schema>({ appId: APP_ID });

function App() {
  // Read Data
  const { isLoading, error, data } = db.useQuery({ todos: {} });
  if (isLoading) {
    return <div>Fetching data...</div>;
  }
  if (error) {
    return <div>Error fetching data: {error.message}</div>;
  }
  const { todos } = data;
  return (
    <div style={styles.container}>
      <div style={styles.header}>todos</div>
      <TodoForm todos={todos} />
      <TodoList todos={todos} />
      <ActionBar todos={todos} />
      <div style={styles.footer}>
        Open another tab to see todos update in realtime!
      </div>
    </div>
  );
}

// Write Data
// ---------
function addTodo(text: string, color: string, deadline?: string) {
  db.transact(
    tx.todos[id()].update({
      text,
      done: false,
      createdAt: Date.now(),
      color,
      deadline,
    })
  );
}

function deleteTodo(todo: Todo) {
  db.transact(tx.todos[todo.id].delete());
}

function toggleDone(todo: Todo) {
  db.transact(tx.todos[todo.id].update({ done: !todo.done }));
}

function deleteCompleted(todos: Todo[]) {
  const completed = todos.filter((todo) => todo.done);
  const txs = completed.map((todo) => tx.todos[todo.id].delete());
  db.transact(txs);
}

function toggleAll(todos: Todo[]) {
  const newVal = !todos.every((todo) => todo.done);
  db.transact(todos.map((todo) => tx.todos[todo.id].update({ done: newVal })));
}

// Components
// ----------
const pastelColors = [
  "#FFFFFF", // No color (white)
  "#FFB3BA", // Light Pink
  "#BAFFC9", // Light Green
  "#BAE1FF", // Light Blue
  "#FFFFBA", // Light Yellow
  "#FFDFBA", // Light Peach
  "#E0BBE4", // Light Purple
  "#D4F0F0", // Light Cyan
  "#FFC6FF", // Light Magenta
];

function TodoForm({ todos }: { todos: Todo[] }) {
  const [color, setColor] = React.useState(pastelColors[0]);
  const [showColorModal, setShowColorModal] = React.useState(false);
  const [deadline, setDeadline] = React.useState('');

  return (
    <div style={styles.form}>
      <div style={styles.toggleAll} onClick={() => toggleAll(todos)}>
        ⌄
      </div>
      <form
        style={styles.inputContainer}
        onSubmit={(e) => {
          e.preventDefault();
          addTodo(e.target[0].value, color, deadline);
          e.target[0].value = "";
          setColor(pastelColors[0]);
          setDeadline('');
        }}>
        <input
          style={{
            ...styles.input,
            borderColor: color === "#FFFFFF" ? "lightgray" : color,
          }}
          autoFocus
          placeholder="What needs to be done?"
          type="text"
        />
        <div 
          style={styles.colorButton}
          onClick={() => setShowColorModal(!showColorModal)}
        >
          ⋮
        </div>
        {showColorModal && (
          <div style={styles.colorModal}>
            {pastelColors.map((c, index) => (
              <div
                key={c}
                style={{
                  ...styles.colorOption,
                  backgroundColor: c,
                  border: c === color ? "2px solid black" : "1px solid lightgray",
                  ...(index === 0 && styles.noColorOption),
                }}
                onClick={() => {
                  setColor(c);
                  setShowColorModal(false);
                }}
              >
                {index === 0 && <span style={styles.noColorText}>X</span>}
              </div>
            ))}
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              style={styles.deadlineInput}
            />
          </div>
        )}
      </form>
    </div>
  );
}

function TodoList({ todos }: { todos: Todo[] }) {
  const todosWithDeadline = todos.filter(todo => todo.deadline).sort((a, b) => 
    new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime()
  );
  const todosWithoutDeadline = todos.filter(todo => !todo.deadline);

  return (
    <div style={styles.todoList}>
      {todosWithDeadline.length > 0 && (
        <div>
          <h3>Todos with Deadlines</h3>
          {todosWithDeadline.map(todo => <TodoItem key={todo.id} todo={todo} />)}
        </div>
      )}
      {todosWithoutDeadline.length > 0 && (
        <div>
          <h3>Todos without Deadlines</h3>
          {todosWithoutDeadline.map(todo => <TodoItem key={todo.id} todo={todo} />)}
        </div>
      )}
    </div>
  );
}

function TodoItem({ todo }: { todo: Todo }) {
  return (
    <div style={{
      ...styles.todo, 
      backgroundColor: todo.color === "#FFFFFF" ? "transparent" : todo.color
    }}>
      <input
        type="checkbox"
        style={styles.checkbox}
        checked={todo.done}
        onChange={() => toggleDone(todo)}
      />
      <div style={styles.todoText}>
        <span>{todo.text}</span>
        {todo.deadline && (
          <span style={styles.deadline}>
            Due: {format(parseISO(todo.deadline), 'MMM d, yyyy')}
          </span>
        )}
      </div>
      <span onClick={() => deleteTodo(todo)} style={styles.delete}>
        𝘟
      </span>
    </div>
  );
}

function ActionBar({ todos }: { todos: Todo[] }) {
  return (
    <div style={styles.actionBar}>
      <div>Remaining todos: {todos.filter((todo) => !todo.done).length}</div>
      <div style={{ cursor: "pointer" }} onClick={() => deleteCompleted(todos)}>
        Delete Completed
      </div>
    </div>
  );
}

// Types
// ----------
type Todo = {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
  color: string;
  deadline?: string;
};

// Styles
// ----------
const styles: Record<string, React.CSSProperties> = {
  container: {
    boxSizing: "border-box",
    backgroundColor: "#fafafa",
    fontFamily: "code, monospace",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
  },
  header: {
    letterSpacing: "2px",
    fontSize: "50px",
    color: "lightgray",
    marginBottom: "10px",
  },
  form: {
    boxSizing: "border-box",
    display: "flex",
    border: "1px solid lightgray",
    borderBottomWidth: "0px",
    width: "350px",
  },
  toggleAll: {
    fontSize: "30px",
    cursor: "pointer",
    marginLeft: "11px",
    marginTop: "-6px",
    width: "15px",
    marginRight: "12px",
  },
  inputContainer: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    position: "relative",
  },
  input: {
    backgroundColor: "transparent",
    fontFamily: "code, monospace",
    width: "287px",
    padding: "10px",
    fontStyle: "italic",
    flexGrow: 1,
    border: "none",
    borderRight: "1px solid lightgray",
    outline: "none",
  },
  colorButton: {
    cursor: "pointer",
    fontSize: "20px",
    width: "40px",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  colorModal: {
    position: "absolute",
    top: "100%",
    right: "0",
    backgroundColor: "white",
    border: "1px solid lightgray",
    borderRadius: "4px",
    padding: "5px",
    display: "flex",
    flexWrap: "wrap",
    width: "120px",
    zIndex: 1,
  },
  colorOption: {
    width: "20px",
    height: "20px",
    borderRadius: "4px",
    margin: "2px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  noColorOption: {
    backgroundColor: "white",
    border: "1px solid lightgray",
  },
  noColorText: {
    color: "lightgray",
    fontSize: "14px",
    fontWeight: "bold",
  },
  todoList: {
    boxSizing: "inherit",
    width: "350px",
  },
  checkbox: {
    fontSize: "30px",
    marginLeft: "5px",
    marginRight: "20px",
    cursor: "pointer",
  },
  todo: {
    display: "flex",
    alignItems: "center",
    padding: "10px",
    border: "1px solid lightgray",
    borderBottomWidth: "0px",
  },
  todoText: {
    flexGrow: "1",
    overflow: "hidden",
  },
  delete: {
    width: "25px",
    cursor: "pointer",
    color: "black",
  },
  actionBar: {
    display: "flex",
    justifyContent: "space-between",
    width: "328px",
    padding: "10px",
    border: "1px solid lightgray",
    fontSize: "10px",
  },
  footer: {
    marginTop: "20px",
    fontSize: "10px",
  },
  deadlineInput: {
    width: '100%',
    marginTop: '5px',
    padding: '5px',
    border: '1px solid lightgray',
    borderRadius: '4px',
  },
  deadline: {
    fontSize: '0.8em',
    color: '#888',
    marginLeft: '10px',
  },
};

export default App;
