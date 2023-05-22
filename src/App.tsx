import debounce from "lodash.debounce";
import { useEffect, useMemo, useRef, useState } from "react";
import { Field, Form, FormSpy } from "react-final-form";
import Styles from "./Styles";
import * as indexedDB from "idb";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const onSubmit = async (values: Record<string, unknown>) => {
  await sleep(300);
  window.alert(JSON.stringify(values, null, 2));
};

type Message = {
  id: number;
  [key:string]: unknown;
};

type FormValues = {
  firstName: string;
  lastName: string;
  legal: string;
};

const postMessage = debounce((worker: Worker, data: Message) => {
  if (window.Window) {
    worker.postMessage(JSON.stringify(data));
  }
}, 3000);

const App = () => {
  const worker = useMemo(() => new Worker(new URL("/worker.js", import.meta.url), { type: "module" }), []);
  const inputEl = useRef<HTMLInputElement>(null);
  const [initialValues, setInitialValues] = useState<FormValues>({ firstName: "", lastName: "", legal: "" });

  useEffect(() => {
    async function getInititalValues(employeeId: number) {
      const db = await indexedDB.openDB("order");
      let employeeData = {} as FormValues;
      if (db.objectStoreNames.contains("employees")) {
        const store = db.transaction("employees", "readonly").objectStore("employees");
        employeeData = await store.get(employeeId) || {} as FormValues;
      }
      setInitialValues(employeeData)
    }
    void getInititalValues(2);
  }, []);

  const onButtonClick = () => {
    inputEl.current?.focus();
  };

  return (
    <Styles>
      <h1>How to get ref of input wrapped by &lt;Field&gt;</h1>

      <Form
        onSubmit={onSubmit}
        initialValues={initialValues}
      >
        {({ handleSubmit }) => {
          return (
            <>
              <FormSpy
                onChange={(state) => {
                  const values = state.values || {};
                  console.log(values);
                  postMessage(worker, { id: 2, ...values });
                }}
                subscription={{ values: true }}
              />
              <form onSubmit={handleSubmit}>
                <div>
                  <label>First Name</label>
                  <Field
                    name="firstName"
                    component={(props) => {
                      return (
                        <input
                          onBlur={props.input.onBlur}
                          onChange={props.input.onChange}
                          ref={inputEl}
                          value={props.input.value}
                        />
                      );
                    }}
                    type="text"
                    placeholder="First Name"
                  />
                  <button type="button" onClick={onButtonClick}>
                    Focus the input
                  </button>
                </div>
                <div>
                  <label>Last Name</label>
                  <Field
                    name="lastName"
                    component="input"
                    type="text"
                    placeholder="Last Name"
                  />
                </div>
                <div>
                  <label>Are you older than 18</label>
                  {["Yes", "No"].map((option) => {
                    return (
                      <Field
                        key={option}
                        name="legal"
                        type="radio"
                        value={option}
                        subscription={{ value: true }}
                      >
                        {({ input }) => (
                          <input
                            name={input.name}
                            key={option}
                            onBlur={input.onBlur}
                            onChange={input.onChange}
                            value={input.value}
                            checked={input.checked}
                            type={input.type}
                          />
                        )}
                      </Field>
                    );
                  })}
                </div>
                <button type="submit">submit</button>
              </form>
            </>
          );
        }}
      </Form>
    </Styles>
  );
};

export default App;
