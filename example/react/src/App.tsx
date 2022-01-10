import { Suspense } from 'react';
import MdPreviewer from './components/MdPreviewer';
import { MdContent, MdDemos } from './test.md';
import './App.css';

const DemoRender = () => {
  return (
    <div className="demo">
      {MdDemos.map((Com, i) => (
        <div key={i}>
          <Com />
        </div>
      ))}
    </div>
  );
};

function App() {
  return (
    <Suspense fallback={<div>loading...</div>}>
      <div className="App">
        <header className="App-header">
          <MdContent
            previewer={props => {
              console.log(props)
              return <MdPreviewer {...props} />
            }}
          />
        </header>
        <DemoRender />
      </div>
    </Suspense>
  );
}

export default App;
