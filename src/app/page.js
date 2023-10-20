'use client'
import React, { useState,useEffect } from 'react';
import axios from 'axios';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/theme-gruvbox_dark_hard';
import 'ace-builds/src-noconflict/theme-gruvbox_light_hard';
import 'ace-builds/src-noconflict/theme-dracula';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-github_dark';
import 'ace-builds/src-noconflict/theme-one_dark';
import 'ace-builds/src-noconflict/theme-nord_dark';
import 'ace-builds/src-noconflict/theme-solarized_light';
import 'ace-builds/src-noconflict/theme-cobalt';
import 'ace-builds/src-noconflict/mode-c_cpp';
import 'ace-builds/src-noconflict/mode-java';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-python';
import LoadingScreen from './components/LoadingScreen';
const themeOptions = [
    { value: 'monokai', label: 'Monokai Theme' },
    { value: 'gruvbox_dark_hard', label: 'Gruvbox Dark Theme' },
    { value: 'gruvbox_light_hard', label: 'Gruvbox Light Theme' },
    { value: 'dracula', label: 'Dracula Theme' },
    { value: 'github_dark', label: 'GitHub Dark Theme' },
    { value: 'github', label: 'GitHub Light Theme' },
    { value: 'one_dark', label: 'One Dark Theme' },
    { value: 'nord_dark', label: 'Nord Dark Theme' },
    { value: 'solarized_light', label: 'Solarized Light Theme' },
    { value: 'cobalt', label: 'Cobalt Theme' },
];

const fontSizeOptions = [
    { value: 10, label: '10px' },
    { value: 12, label: '12px' },
    { value: 14, label: '14px' },
    { value: 16, label: '16px' },
    { value: 18, label: '18px' },
    { value: 20, label: '20px' },
];

const languageOptions = [
    { value: 'python', label: 'Python', mode: 'python' },
    { value: 'javascript', label: 'JavaScript', mode: 'javascript' },
    { value: 'java', label: 'Java', mode: 'java' },
    { value: 'c', label: 'C', mode: 'c_cpp' },
    { value: 'cpp', label: 'C++', mode: 'c_cpp' },
];

export default function Page() {
    const [userCode, setUserCode] = useState('');
    const [userLang, setUserLang] = useState({ value: 'python', label: 'Python', mode: 'python' });
    const [userInput, setUserInput] = useState(new Array(1).fill(''));
    const [userOutput, setUserOutput] = useState([]);
    const [loading, setLoading] = useState(false);
    const [theme, setTheme] = useState('monokai');
    const [fontSize, setFontSize] = useState(16);
    
    useEffect(() => {
        const savedCode = localStorage.getItem('userCode');
        if (savedCode) {
            setUserCode(savedCode);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('userCode', userCode);
    }, [userCode]);

    const editorOptions = {
        autoScrollEditorIntoView: true,
        copyWithEmptySelection: true,
        fontSize: fontSize,
    };

    function saveCodeToFile() {
        const code = userCode;
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = document.getElementById('filename').value;
        a.click();
        URL.revokeObjectURL(url);
    }

    function loadCodeFromFile(event) {
        const file = event.target.files[0];
        const reader = new FileReader();
      
        reader.onload = function(e) {
            const content = e.target.result;
            setUserCode(content);
        };
      
        reader.readAsText(file);
    }      

    function addTestCase() {
        setUserInput([...userInput, '']);
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
        if (userCode === '') return;

        setLoading(true);

        const promises = userInput.map((testCase) => {
            const data = {
                code: userCode,
                language: userLang.label,
                input: testCase,
            };
            const config = {
                method: 'post',
                url: process.env.NEXT_PUBLIC_API_URL,
                data: data,
            };
            return axios(config)
                .then(function (response) {
                    const responseData = response.data;
                    return responseData.output;
                })
                .catch(function (error) {
                    console.log('Error executing code:', error);
                    return 'Error executing code.';
                });
        });

        Promise.all(promises)
            .then((results) => {
                setUserOutput(results);
            })
            .catch((error) => {
                console.log('Error executing code:', error);
                setUserOutput(['Error executing code.']);
            })
            .finally(() => {
                setLoading(false);
            });
    } 

    return (
        <div>
            <div className='bg-red-500 p-2 my-2 rounded'>
                <h1 className='font-bold text-gray-700 text-xl'>
                    CodeRunner
                </h1>
            </div>
            <div className='flex'>
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
                <div className='flex flex-col m-5 w-3/4'>
                    <div className='p-4 rounded-md bg-gray-900'>
                        <div className='flex items-center justify-between mb-3'>
                            <label className='text-white'>Filename:</label>
                            <input
                                type='text'
                                id='filename'
                                className='w-1/2 p-2 bg-gray-800 border border-gray-300 rounded-lg text-white focus:outline-none'
                            />
                            <button
                                onClick={saveCodeToFile}
                                className='p-2 m-2 rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none'
                            >
                                Save Code
                            </button>
                        </div>
                        <div>
                            <input
                                type="file"
                                onChange={loadCodeFromFile}
                                className='w-full p-3 bg-gray-800 border border-gray-300 rounded-lg text-white focus:outline-none'
                            />
                        </div>
                    </div>
                    <div className="flex items-center flex-wrap justify-between mb-4">
                        <div className="theme-select space-x-4 p-4">
                            <label htmlFor="themeSelect" className="">
                                Select Theme:
                            </label>
                            <select
                                id="themeSelect"
                                value={theme}
                                onChange={(e) => setTheme(e.target.value)}
                                className="rounded-md border-gray-300 shadow-sm focus:ring focus:ring-green-300 focus:border-green-300"
                            >
                                {themeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
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
                                onChange={(e) => setFontSize(parseInt(e.target.value))}
                                className="rounded-md border-gray-300 shadow-sm focus:ring focus:ring-green-300 focus:border-green-300"
                            >
                                {fontSizeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
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
                                    const selectedLanguage = languageOptions.find(
                                        (option) => option.value === selectedValue
                                    );
                                    setUserLang(selectedLanguage);
                                }}
                                className="rounded-md border-gray-300 shadow-sm focus:ring focus:ring-green-300 focus:border-green-300"
                            >
                                {languageOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="p-2 rounded bg-slate-300">
                        {loading ? (
                            <LoadingScreen />
                        ) : (
                            <>
                                <h3 className="text-xl mb-2">Test Cases:</h3>
                                <div className="flex">
                                    <div className="add-test-case bg-white m-2 w-fit p-2 text-center rounded">
                                        <button onClick={addTestCase} className="add-test-case-button w-full">
                                            Add +
                                        </button>
                                    </div>
                                    <div className="del-test-case bg-white m-2 w-fit p-2 text-center rounded">
                                        <button onClick={deleteTestCase} className="w-full" disabled={!userInput || userInput.length === 0}>
                                            Delete -
                                        </button>
                                    </div>
                                </div>
                                <div className="test-cases m-1">
                                    {userInput.map((testCase, index) => (
                                        <textarea
                                            key={index}
                                            value={testCase}
                                            onChange={(e) => handleTestCaseChange(e, index)}
                                            className="test-input m-2 border resize-none p-2"
                                        />
                                    ))}
                                </div>
                                <div className='bg-red-600 m-2 text-center w-28 shadow-inner rounded shadow-red-900'>
                                    <button onClick={runCode} className="run-button w-full" disabled={loading}>
                                        Run code &gt;&gt;
                                    </button>
                                </div>

                                <h3 className="text-xl mb-2 text-black">Output:</h3>
                                {userOutput.map((output, index) => (
                                    <div className="output m-2 text-xl" key={index}>
                                        <pre className="bg-black overflow-x-auto text-white p-2">{output}</pre>
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

