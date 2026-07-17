import React from 'react'
import { useState, useEffect } from 'react'
import { supabase } from './utils/supabase'

function App() {
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [todos, setTodos] = useState([])

  async function InsertData() {
    setLoading(true)
    const { error } = await supabase
      .from('post')
      .upsert({ id: 1, name: text });
    setLoading(false)
  }

  useEffect(() => {
    async function getTodos() {
      const { data: todos } = await supabase.from('post').select()

      if (todos) {
        setTodos(todos)
      }
    }

    getTodos()
  }, [loading])

  function copyTodoText(content) {
    navigator.clipboard.writeText(content)
  }

  return (
    <div>
      <main className="container">
        <div className="share-box">
          <h2>Every Share</h2>
          <textarea placeholder="Type Text Here.." onChange={(e) => setText(e.target.value)}></textarea>
          <button onClick={InsertData}>{loading ? "Saving" : "Save"}</button>
          <br />
          <br />
        </div>
        <div className='show-text'>
          {todos.map((todo) => (
            <div key={todo.id}> {/* 👈 Key goes here */}
              <p>{todo.name}</p>
              <button onClick={() => copyTodoText(todo.name)}>Copy Text</button>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default App