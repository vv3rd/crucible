import{j as r}from"./jsx-runtime--3Vb6qXs.js";import{r as s}from"./index-ZTOZCyuL.js";import{r as i}from"./index-ygKPTG2k.js";import{Router as n}from"./rsc0-47a606723.js";import"./waku-client.js";var a,e=i;e.createRoot,a=e.hydrateRoot;class c extends s.Component{constructor(t){super(t),this.state={}}static getDerivedStateFromError(t){return{error:t}}render(){return"error"in this.state?this.props.fallback(this.state.error):this.props.children}}const m=c,d=r.jsx(s.StrictMode,{children:r.jsx(m,{fallback:o=>r.jsx("h1",{children:String(o)}),children:r.jsx(n,{})})});a(document.body,d);
