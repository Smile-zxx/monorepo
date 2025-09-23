import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './layouts/Layout'
import { routes } from './config/routes'

function App() {
  return (
    <Layout>
      <Routes>
        {routes.map((route, index) => (
          <Route key={index} path={route.path} element={route.element} />
        ))}
      </Routes>
    </Layout>
  )
}

export default App
