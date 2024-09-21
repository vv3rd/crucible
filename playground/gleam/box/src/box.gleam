import gleam/int
import lustre.{application}
import lustre/attribute.{class}
import lustre/effect as eff
import lustre/element.{text}
import lustre/element/html.{button, div, p}
import lustre/event.{on_click}
import plinth/browser/window

pub fn main() {
  let href = window.location()
  let app = application(init, update, view)
  let inputs = Inputs(href)
  let assert Ok(_) = lustre.start(app, "#app", inputs)

  Nil
}

type Inputs {
  Inputs(href: String)
}

type Model {
  Model(count: Int, page: Page)
}

type Page {
  IndexPage
  NotFoundPage
}

fn page_from_href(href: String) {
  case href {
    "/" -> IndexPage
    _ -> NotFoundPage
  }
}

fn init(ins: Inputs) {
  let page = page_from_href(ins.href)
  let model = Model(count: 0, page: page)
  #(model, eff.none())
}

type Msg {
  Incr
  Decr
}

fn update(model: Model, msg) {
  let next_model = case msg {
    Incr -> Model(..model, count: model.count + 1)
    Decr -> Model(..model, count: model.count - 1)
  }
  #(next_model, eff.none())
}

fn d_button(a, c) {
  button([class(" btn "), ..a], c)
}

fn view(model: Model) {
  let count = int.to_string(model.count)

  div([class(" container p-4 mx-auto ")], [
    d_button([on_click(Incr)], [text(" + ")]),
    p([], [text(count)]),
    d_button([on_click(Decr)], [text(" - ")]),
  ])
}
