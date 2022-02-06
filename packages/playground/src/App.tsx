import { MdContent, MdDemos, frontmatter } from './demo.md';
// import { Previewer as MdPreviewer } from 'mdoc-default-previewer';
import MdPreviewer from './components/MdPreviewer';
import './App.css';

console.log(frontmatter);

const DemoRender = () => {
  return (
    <div className="demo">
      {MdDemos.map(({ Component, key, ...props }) => (
        <div key={key}>
          {props.title && <h4>{props.title}</h4>}
          <Component />
        </div>
      ))}
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <header className="App-header markdown">
        <MdContent
          previewer={props => {
            console.log(props);
            return <MdPreviewer {...props} />;
          }}
        />
      </header>
      <DemoRender />
    </div>
  );
}

export default App;
