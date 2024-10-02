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

const fontSizeOptions = [
    { value: 10, label: "10px" },
    { value: 12, label: "12px" },
    { value: 14, label: "14px" },
    { value: 16, label: "16px" },
    { value: 18, label: "18px" },
    { value: 20, label: "20px" },
];

const languageOptions = [
    { value: "python", label: "Python", mode: "python" },
    { value: "javascript", label: "JavaScript", mode: "javascript" },
    { value: "java", label: "Java", mode: "java" },
    { value: "c", label: "C", mode: "c_cpp" },
    { value: "cpp", label: "C++", mode: "c_cpp" },
];

const lightIcon = (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
    </svg>
);

const darkIcon = (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
    </svg>
);

const lightThemeStyles = `
  body {
    background-color: #F6EACB;
  }
`;

const darkThemeStyles = `
  body.dark {
    background-color: #36454F;
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

    //User code in localStorage
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
                    <h1 className="font-bold text-gray-700 text-xl">
                        CodeRunner
                    </h1>
                </div>
                <button
                    className="w-20 h-10 rounded-full bg-white transition duration-300 focus:outline-none shadow"
                    onClick={toggleTheme}
                >
                    <div
                        ref={switchToggleRef}
                        className={`w-6 h-6 md:w-10 md:h-10 relative rounded-full transition duration-500 transform ${
                            isDarkmode
                                ? "bg-gray-700 translate-x-full"
                                : "bg-yellow-500 -translate-x-2"
                        } p-1 text-white`}
                    >
                        {isDarkmode ? lightIcon : darkIcon}
                    </div>
                </button>
            </div>

            <div className="flex">
                <AceEditor
                    mode={userLang.mode}
                    theme={theme}
                    width="100%"
                    height="500px"
                    value={userCode}
                    onChange={setUserCode}
                    editorProps={{ $blockScrolling: Infinity }}
                    setOptions={editorOptions}
                    showPrintMargin={false}
                />
                <div className="flex flex-col m-5 w-3/4">
                    <div className="flex items-center justify-between mb-3">
                        <label>Filename:</label>
                        <input
                            type="text"
                            id="filename"
                            className="w-1/2 p-2 bg-zinc-300 border border-gray-300 rounded-lg focus:outline-none"
                        />
                        <button
                            onClick={saveCodeToFile}
                            className="p-2 m-2 text-black rounded bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                        >
                            Save Code
                        </button>
                    </div>
                    <div className="text-black">
                        <input
                            type="file"
                            onChange={loadCodeFromFile}
                            className="w-full p-3 bg-zinc-300 border border-gray-300 rounded-lg focus:outline-none"
                        />
                    </div>
                    <div className="flex items-center flex-wrap justify-between mb-4">
                        <div className="theme-select space-x-4 p-4 ">
                            <label htmlFor="themeSelect" className="">
                                Select Editor Theme:
                            </label>
                            <select
                            
                                id="themeSelect"
                                value={theme}
                                onChange={(e) => setTheme(e.target.value)}
                                className="rounded text-black first-letter:rounded-md border-gray-300 shadow-sm focus:ring focus:ring-green-300 focus:border-green-300"
                            >
                                {themeOptions.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="font-size-select space-x-4 p-4">
                            <label htmlFor="fontSizeSelect" className="">
                                Select Font Size:
                            </label>
                            <select
                                id="fontSizeSelect"
                                value={fontSize}
                                onChange={(e) =>
                                    setFontSize(parseInt(e.target.value))
                                }
                                className="rounded-md text-black border-gray-300 shadow-sm focus:ring focus:ring-green-300 focus:border-green-300"
                            >
                                {fontSizeOptions.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="language-select space-x-4 p-4">
                            <label htmlFor="languageSelect" className="">
                                Select Language:
                            </label>
                            <select
                                id="languageSelect"
                                value={userLang.value}
                                onChange={(e) => {
                                    const selectedValue = e.target.value;
                                    const selectedLanguage =
                                        languageOptions.find(
                                            (option) =>
                                                option.value === selectedValue
                                        );
                                    setUserLang(selectedLanguage);
                                }}
                                className="rounded-md text-black border-gray-300 shadow-sm focus:ring focus:ring-green-300 focus:border-green-300"
                            >
                                {languageOptions.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="p-2 rounded ">
                        {loading ? (
                            <LoadingScreen />
                        ) : (
                            <>
                                <h3 className="text-xl mb-2">Test Cases:</h3>
                                <div className="flex">
                                    <div className="add-test-case text-black bg-white m-2 w-fit p-2 text-center rounded">
                                        <button
                                            onClick={addTestCase}
                                            className="add-test-case-button w-full"
                                        >
                                            Add +
                                        </button>
                                    </div>
                                    <div className="del-test-case bg-white m-2 text-black w-fit p-2 text-center rounded">
                                        <button
                                            onClick={deleteTestCase}
                                            className="w-full"
                                            disabled={
                                                !userInput ||
                                                userInput.length === 0
                                            }
                                        >
                                            Delete -
                                        </button>
                                    </div>
                                </div>
                                <div className="test-cases m-1">
                                    {userInput.map((testCase, index) => (
                                        <textarea
                                            key={index}
                                            value={testCase}
                                            onChange={(e) =>
                                                handleTestCaseChange(e, index)
                                            }
                                            className="test-input m-2 border resize-none p-2"
                                        />
                                    ))}
                                </div>
                                <div className="bg-red-600 m-2 text-black text-center w-28 shadow-inner rounded shadow-red-900">
                                    <button
                                        onClick={runCode}
                                        className="run-button w-full"
                                        disabled={loading}
                                    >
                                        Run code &gt;&gt;
                                    </button>
                                </div>

                                <h3 className="text-xl mb-2">Output:</h3>
                                {userOutput.map((output, index) => (
                                    <div
                                        className="output m-2 text-xl"
                                        key={index}
                                    >
                                        <pre className="bg-black overflow-x-auto text-white p-2">
                                            {output}
                                        </pre>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
