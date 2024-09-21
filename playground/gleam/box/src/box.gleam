import gleam/int
import lustre
import lustre/attribute.{class}
import lustre/element.{text}
import lustre/element/html.{button, div, p}
import lustre/event.{on_click}
import plinth/browser/window

pub fn main() {
  let href = window.location()
  let app = lustre.simple(init, update, view)
  let inputs = Inputs(href)
  let assert Ok(_) = lustre.start(app, "#app", inputs)

  Nil
}

type Inputs {
  Inputs(href: String)
}

type Model {
  Model(count: Int, location: String)
}

fn init(ins: Inputs) {
  Model(count: 0, location: ins.href)
}

type Msg {
  Incr
  Decr
}

fn update(model: Model, msg) {
  case msg {
    Incr -> Model(..model, count: model.count + 1)
    Decr -> Model(..model, count: model.count - 1)
  }
}

fn d_button(attrs, children) {
  button([class(" btn "), ..attrs], children)
}

fn view(model: Model) {
  let count = int.to_string(model.count)

  div([class(" container p-4 mx-auto ")], [
    d_button([on_click(Incr)], [text(" + ")]),
    p([], [text(count)]),
    d_button([on_click(Decr)], [text(" - ")]),
  ])
}
