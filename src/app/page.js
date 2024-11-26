"use client";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/theme-gruvbox_dark_hard";
import "ace-builds/src-noconflict/theme-gruvbox_light_hard";
import "ace-builds/src-noconflict/theme-dracula";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-github_dark";
import "ace-builds/src-noconflict/theme-one_dark";
import "ace-builds/src-noconflict/theme-nord_dark";
import "ace-builds/src-noconflict/theme-solarized_light";
import "ace-builds/src-noconflict/theme-cobalt";
import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/ext-searchbox";
import LoadingScreen from "./components/LoadingScreen";
const themeOptions = [
  { value: "monokai", label: "Monokai Theme" },
  { value: "gruvbox_dark_hard", label: "Gruvbox Dark Theme" },
  { value: "gruvbox_light_hard", label: "Gruvbox Light Theme" },
  { value: "dracula", label: "Dracula Theme" },
  { value: "github_dark", label: "GitHub Dark Theme" },
  { value: "github", label: "GitHub Light Theme" },
  { value: "one_dark", label: "One Dark Theme" },
  { value: "nord_dark", label: "Nord Dark Theme" },
  { value: "solarized_light", label: "Solarized Light Theme" },
  { value: "cobalt", label: "Cobalt Theme" },
];

const languageOptions = [
  { value: "python", label: "Python", mode: "python" },
  { value: "javascript", label: "JavaScript", mode: "javascript" },
  { value: "java", label: "Java", mode: "java" },
  { value: "c", label: "C", mode: "c_cpp" },
  { value: "cpp", label: "C++", mode: "c_cpp" },
];

const lightThemeStyles = `
  body {
    background-color: #F9F9F9;
  }
`;

const darkThemeStyles = `
  body.dark {
    background-color: #24292E;
  }
`;

export default function Page() {
  const [userCode, setUserCode] = useState("");
  const [userLang, setUserLang] = useState({
    value: "python",
    label: "Python",
    mode: "python",
  });
  const [isDarkmode, setIsDarkmode] = useState(true);
  const [userInput, setUserInput] = useState(new Array(1).fill(""));
  const [userOutput, setUserOutput] = useState([]);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("monokai");
  const [fontSize, setFontSize] = useState(16);
  const editorOptions = {
    autoScrollEditorIntoView: true,
    copyWithEmptySelection: true,
    fontSize: fontSize,
  };

  const switchToggleRef = useRef(null);
  useEffect(() => {
    const body = document.body;
    body.classList.toggle("dark", isDarkmode);
  }, [isDarkmode]);

  useEffect(() => {
    const head = document.head;
    const existingStyle = head.querySelector("#themeStyles");

    if (existingStyle) {
      existingStyle.textContent = isDarkmode
        ? darkThemeStyles
        : lightThemeStyles;
    } else {
      const styleElement = document.createElement("style");
      styleElement.id = "themeStyles";
      styleElement.type = "text/css";
      styleElement.textContent = isDarkmode
        ? darkThemeStyles
        : lightThemeStyles;
      head.appendChild(styleElement);
    }
  }, [isDarkmode]);
  useEffect(() => {
    const savedCode = localStorage.getItem("userCode");
    if (savedCode) {
      setUserCode(savedCode);
    }
  }, []);
  useEffect(() => {
    localStorage.setItem("userCode", userCode);
  }, [userCode]);

  //Functions
  function toggleTheme() {
    setIsDarkmode(!isDarkmode);
  }

  function saveCodeToFile() {
    const code = userCode;
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = document.getElementById("filename").value;
    a.click();
    URL.revokeObjectURL(url);
  }

  function loadCodeFromFile(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
      const content = e.target.result;
      setUserCode(content);
    };

    reader.readAsText(file);
  }

  function addTestCase() {
    if (userInput.length < 10) {
      setUserInput([...userInput, ""]);
    }
  }

  function deleteTestCase() {
    if (userInput.length === 1) return;
    const updatedInput = userInput.slice(0, userInput.length - 1);
    setUserInput(updatedInput);
  }

  function handleTestCaseChange(e, index) {
    const updatedInput = [...userInput];
    updatedInput[index] = e.target.value;
    setUserInput(updatedInput);
  }

  function runCode() {
    if (userCode === "") return;

    setLoading(true);

    const promises = userInput.map((testCase) => {
      const data = {
        code: userCode,
        language: userLang.label,
        input: testCase,
      };
      const config = {
        method: "post",
        url: process.env.NEXT_PUBLIC_API_URL,
        data: data,
      };
      return axios(config)
        .then(function (response) {
          const responseData = response.data;
          return responseData.output;
        })
        .catch(function (error) {
          console.log("Error executing code:", error);
          return "Error executing code.";
        });
    });

    Promise.all(promises)
      .then((results) => {
        setUserOutput(results);
      })
      .catch((error) => {
        console.log("Error executing code:", error);
        setUserOutput(["Error executing code."]);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <div className={isDarkmode ? "text-white" : "text-black"}>
      <div className="bg-red-500 p-2 my-2 rounded flex flex-row justify-between items-center">
        <div className="mb-2 md:mb-0">
          <h1 className="font-bold text-gray-700 text-xl">CodeRunner</h1>
        </div>
        <div className="items-center">
          <button
            className={`w-20 h-10  bg-blue-500 ${
              !isDarkmode ? "border-2 border-white" : ""
            } rounded-l-md transition duration-300 focus:outline-none shadow`}
            onClick={toggleTheme}
            disabled={!isDarkmode}
          >
            ☀️
          </button>
          <button
            className={`w-20 h-10 bg-gray-600 ${
              isDarkmode ? "border-2 border-white" : ""
            } rounded-r-md transition duration-300 focus:outline-none shadow`}
            onClick={toggleTheme}
            disabled={isDarkmode}
          >
            🌙
          </button>
        </div>
      </div>

      <div className="flex">
        <div className="flex flex-col w-3/5">
          <AceEditor
            mode={userLang.mode}
            theme={`${isDarkmode ? "github_dark" : "github"}`}
            width="100%"
            height="90vh"
            value={userCode}
            onChange={setUserCode}
            editorProps={{ $blockScrolling: Infinity }}
            setOptions={editorOptions}
            showPrintMargin={false}
          />
        </div>
        <div className="flex flex-col w-2/5 m-2">
          <div className="flex items-center">
            <label className="p-2">Filename:</label>
            <input
              type="text"
              id="filename"
              className="text-black p-2 m-1 bg-zinc-300 border w-1/2 border-gray-300 rounded-lg focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  saveCodeToFile();
                }
              }}
            />
            <button
              onClick={saveCodeToFile}
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mx-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
            >
              Save Code
            </button>
          </div>

          <div className="flex items-center">
            <label className="p-2">Load File:</label>
            <input
              type="file"
              onChange={loadCodeFromFile}
              className="text-black p-2 bg-zinc-300 border  border-gray-300 rounded-lg focus:outline-none"
            />
          </div>
          <div className="language-select space-x-4 py-4 pl-2">
            <label htmlFor="languageSelect" className="">
              Select Language:
            </label>
            <select
              id="languageSelect"
              value={userLang.value}
              onChange={(e) => {
                const selectedValue = e.target.value;
                const selectedLanguage = languageOptions.find(
                  (option) => option.value === selectedValue
                );
                setUserLang(selectedLanguage);
              }}
              className="rounded-md text-black border-gray-300 shadow-sm focus:ring focus:ring-green-300 focus:border-green-300"
            >
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="pl-2">
            {loading ? (
              <LoadingScreen />
            ) : (
              <>
                <h3 className="text-xl mb-2">Test Cases:</h3>
                <div className="flex">
                  <div className="add-test-case focus:outline-none hover:bg-gray-500 text-black bg-[#EFEFEF] m-1 font-medium rounded-lg text-sm text-center">
                    <button onClick={addTestCase} className="px-5 py-2.5">
                      Add +
                    </button>
                  </div>
                  <div className="del-test-case bg-[#EFEFEF] m-1 focus:outline-none hover:bg-gray-500 text-black text-center font-medium rounded-lg text-sm">
                    <button
                      onClick={deleteTestCase}
                      className="px-5 py-2.5"
                      disabled={!userInput || userInput.length === 0}
                    >
                      Delete -
                    </button>
                  </div>
                </div>

                <div className="test-cases m-1 overflow-x-auto whitespace-nowrap flex space-x-4 p-2 rounded-lg">
                  {userInput.map((testCase, index) => (
                    <textarea
                      key={index}
                      value={testCase}
                      onChange={(e) => handleTestCaseChange(e, index)}
                      placeholder={`Test case ${index + 1}`}
                      className="test-input p-1 text-black bg-zinc-300 border border-gray-300 rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none placeholder-gray-400 w-60 h-24 flex-shrink-0"
                    />
                  ))}
                </div>

                <div className="focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800 inline-flex items-center">
                  <button
                    onClick={runCode}
                    className="px-5 py-2.5"
                    disabled={loading}
                  >
                    ▶&nbsp;Run
                  </button>
                </div>

                <h3 className="text-xl mb-2">Output:</h3>

                {/* Scrollable Carousel for Output */}
                <div className="output-carousel">
                  {userOutput.map((output, index) => (
                    <div className="output-item mr-4" key={index}>
                      <pre className="overflow-auto">{output}</pre>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
