import './polyfills';
import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter, Route, Routes } from 'react-router';
import { store } from './store/store';
import App from './App';
import Home from './pages/Home';
import Ceremony from './pages/Ceremony';
import OathLogPage from './pages/OathLogPage';
import NotFound from './pages/NotFound';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<Home />} />
            <Route path="ceremony" element={<Ceremony />} />
            <Route path="log" element={<OathLogPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
