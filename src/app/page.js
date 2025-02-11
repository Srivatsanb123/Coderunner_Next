"use client";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-github_dark";
import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/ext-searchbox";
import LoadingScreen from "./components/LoadingScreen";

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
    background-color: #1E1E1E;
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
  const [userInput, setUserInput] = useState([""]);
  const [userOutput, setUserOutput] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editorWidth, setEditorWidth] = useState("60%");

  const editorOptions = {
    autoScrollEditorIntoView: true,
    copyWithEmptySelection: true,
    fontSize: 16,
  };

  // Updated handleDrag to support both mouse and touch events
  const handleDrag = (clientX) => {
    document.body.style.userSelect = "none"; // Disable text selection globally
    const newWidth = `${Math.min(
      Math.max((clientX / window.innerWidth) * 100, 30),
      70
    )}%`;
    setEditorWidth(newWidth);
  };

  const onMouseMove = (e) => handleDrag(e.clientX);
  const onTouchMove = (e) => handleDrag(e.touches[0].clientX);

  const stopDrag = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", stopDrag);
    document.removeEventListener("touchmove", onTouchMove);
    document.removeEventListener("touchend", stopDrag);
    document.body.style.userSelect = ""; // Re-enable text selection
  };

  const startDrag = () => {
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", stopDrag);
    document.addEventListener("touchmove", onTouchMove);
    document.addEventListener("touchend", stopDrag);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for F5 or Ctrl + Enter
      if (e.key === "F5" || (e.ctrlKey && e.key === "Enter")) {
        e.preventDefault(); // Prevent the default browser refresh action
        runCode(); // Call the runCode function
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [userCode, userInput, userLang]);

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

  function deleteTestCase(index) {
    if (userInput.length === 1) return;
    const updatedInput = userInput.filter((_, i) => i !== index);
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

    const data = {
      code: userCode,
      language: userLang.label,
      inputs: userInput, // Send all test cases as an array
    };

    axios
      .post(process.env.NEXT_PUBLIC_API_URL, data)
      .then((response) => {
        setUserOutput(response.data.outputs);
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
    <div
      className={`flex flex-col h-screen overflow-auto ${
        isDarkmode ? "text-white bg-gray-900" : "text-black bg-gray-100"
      }`}
    >
      <div className="bg-indigo-500 p-2 flex justify-between items-center">
        <h1 className="font-bold text-white text-xl">CodeRunner</h1>
        <div className="flex">
          <button
            className={`px-4 py-2 ${
              !isDarkmode ? "border-2 border-white" : ""
            } bg-blue-500 hover:bg-blue-600 rounded-l-md`}
            onClick={toggleTheme}
            disabled={!isDarkmode}
          >
            ☀️
          </button>
          <button
            className={`px-4 py-2  bg-gray-700 hover:bg-gray-800 ${
              isDarkmode ? "border-2 border-white" : ""
            } rounded-r-md`}
            onClick={toggleTheme}
            disabled={isDarkmode}
          >
            🌙
          </button>
        </div>
      </div>
      <div className="flex flex-grow">
        {/* Left Panel */}
        <div
          className="flex flex-col min-w-[30%] max-w-[70%]"
          style={{ width: editorWidth }}
        >
          <AceEditor
            mode={userLang.mode}
            theme={`${isDarkmode ? "github_dark" : "github"}`}
            width="100%"
            height="100%"
            showPrintMargin={false}
            value={userCode}
            onChange={setUserCode}
            editorProps={{ $blockScrolling: true }}
            setOptions={editorOptions}
          />
        </div>

        <div
          className={`w-4 cursor-col-resize flex justify-center items-center ${
            isDarkmode ? "bg-gray-600" : "bg-gray-200"
          }`}
          onMouseDown={startDrag}
          onTouchStart={startDrag} // Added touch support
        >
          ||
        </div>

        {/* Right Panel */}
        <div
          className="flex flex-col p-4 space-y-4 overflow-y-auto"
          style={{ width: `calc(100% - ${editorWidth})` }}
        >
          <div
            className="flex items-center space-x-4"
            style={{ width: `calc(100% - ${editorWidth})` }}
          >
            <label
              htmlFor="filename"
              className="font-medium whitespace-nowrap flex-none"
            >
              Filename:
            </label>
            <input
              type="text"
              id="filename"
              className="flex p-2 border rounded text-black"
              placeholder="Enter filename"
            />
            <button
              onClick={saveCodeToFile}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex-none"
            >
              Save Code
            </button>
          </div>

          <div className="flex flex-row space-x-4 items-center">
            <label htmlFor="uploadFile" className="font-medium">
              Load File:
            </label>
            <input
              type="file"
              id="uploadFile"
              className="p-2 rounded border"
              onChange={loadCodeFromFile}
            />
          </div>
          <div className="flex flex-row space-x-4 items-center">
            <label htmlFor="languageSelect" className="font-medium">
              Language:
            </label>
            <select
              id="languageSelect"
              value={userLang.value}
              onChange={(e) => {
                const selectedLanguage = languageOptions.find(
                  (option) => option.value === e.target.value
                );
                setUserLang(selectedLanguage);
              }}
              className="p-2 rounded border text-black"
            >
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col space-y-2">
            <h3 className="font-medium">
              Test Cases{" "}
              <button
                onClick={addTestCase}
                className="text-white hover:bg-slate-400 rounded"
              >
                ➕
              </button>
              <button
                onClick={runCode}
                disabled={loading}
                className={`p-2 m-2 ${
                  isDarkmode ? "text-green-400" : "text-green-600"
                }  rounded hover:bg-gray-500 disabled:opacity-50 font-bold`}
              >
                {loading ? "Running..." : "▷ Run all"}
              </button>
            </h3>
            <div className="overflow-x-auto no-scrollbar flex space-x-4">
              {userInput.map((testCase, index) => (
                <div
                  key={index}
                  className={`relative flex-shrink-0 w-64 p-2 ${
                    isDarkmode ? "bg-gray-800" : "bg-gray-200"
                  } rounded-md`}
                >
                  <textarea
                    value={testCase}
                    onChange={(e) => handleTestCaseChange(e, index)}
                    className="w-full h-20 p-2 rounded border text-black resize-none"
                    placeholder={`Test Case ${index + 1}`}
                  />
                  {userInput.length > 1 && (
                    <button
                      onClick={() => deleteTestCase(index)}
                      className={`absolute top-1 right-1 w-6 h-fit ${
                        isDarkmode
                          ? "bg-gray-800 text-gray-200"
                          : "bg-gray-200 text-gray-800"
                      } flex items-center justify-center`}
                    >
                      X
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <h3 className="font-medium">Output</h3>
            <div className="overflow-x-auto no-scrollbar flex space-x-4">
              {userOutput?.map((output, index) => (
                <div
                  key={index}
                  className="relative flex-shrink-0 w-fit p-2 bg-gray-200 rounded-md"
                >
                  <pre className="w-full h-28 p-2 rounded text-black overflow-auto resize-none">
                    {output}
                  </pre>
                </div>
              )) || <p>No output available</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
