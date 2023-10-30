'use client'
import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const Page = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [snackState, toggleSnack] = useState(false);

    const onDismissSnackBar = () => toggleSnack(false);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#F4DFCD]">
            <div className="relative w-full h-full">
                <Image src={"/splash.png"} alt="Background Image" layout="fill" objectFit="cover" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-3/4 bg-white p-8 rounded-lg shadow-lg">
                        <h1 className="text-4xl font-bold mb-10 text-center">Login</h1>
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Username..."
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div className="mb-4">
                            <input
                                type="password"
                                placeholder="Password..."
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <button className="mb-2 text-sm text-blue-500 hover:underline" >Forgot Password?</button>
                        <h3>
                            Login Button Goes Here
                        </h3>
                        <h3>
                            Register Button Goes Here
                        </h3>
                    </div>
                    {snackState && (
                        <div className="fixed bottom-8 bg-white text-center p-3 rounded-lg">
                            Invalid User Credentials
                            <button className="ml-4 text-blue-500" onClick={onDismissSnackBar}>
                                Dismiss
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Page;
