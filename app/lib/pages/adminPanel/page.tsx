"use client";
import React, { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const RERUM_PREFIX = process.env.NEXT_PUBLIC_RERUM_PREFIX;

interface noteTemplate {
  [key: string]: string | Array<string> | object | boolean;
}

export default function AdminPanel() {
  const [noteTemplate, setnoteTemplate] = useState<noteTemplate | null>(null);
  const [userTemplate, setuserTemplate] = useState<noteTemplate | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const url = `${RERUM_PREFIX}query`;
    const contentType = "Content-Type: application/json";
    const jsonNoteBody = {
      type: "message",
      published: true,
    };

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": contentType,
      },
      body: JSON.stringify(jsonNoteBody),
    })
      .then((response) => response.json())
      .then((data) => {
        const template = generateCustomTemplate(data);
        setnoteTemplate(template);
      })
      .catch((error) => {
        console.error("Error fetching schema:", error);
      });
  }, []);

  function generateCustomTemplate(dataArray: any[]): noteTemplate {
    const template: noteTemplate = {};
    if (dataArray && dataArray.length > 0) {
      const item = dataArray[0];
      Object.keys(item).forEach((key) => {
        const value = item[key];
        if (Array.isArray(value)) {
          const elementType = value.length > 0 ? typeof value[0] : "unknown";
          template[key] =
            elementType === "object"
              ? "[object array]"
              : `[${elementType} array]`;
        } else if (typeof value === "object" && value !== null) {
          if (value instanceof Date) {
            template[key] = "Date";
          } else {
            template[key] = "object";
          }
        } else {
          template[key] = typeof value;
        }
      });
    }
    return template;
  }

  const handleLogin = async () => {
    try {
      const response = await fetch(RERUM_PREFIX + "login", {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        headers: {
          "Content-Type": "application/json;charset=utf-8",
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setuserTemplate(data);
      } else {
        throw new Error("There was a server error logging in.");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="flex h-screen justify-center p-4">
      <ScrollArea className="w-full max-w-4xl">
        <h1 className="text-4xl font-bold text-center">Admin Panel</h1>
        <h2 className="text-xl text-center my-4">
          This is the admin panel. Here you can make modifications to the
          backend schema
        </h2>
        <Card className="flex flex-col items-center p-5">
          <Tabs defaultValue="note" className="w-full">
            <div className="flex flex-row justify-center">
              <TabsList className="justify-center">
                <TabsTrigger value="note">Note Schema</TabsTrigger>
                <TabsTrigger value="account">Account Schema</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="account" className="w-full p-3">
              <div className="text-lg font-semibold mb-2">
                This is the current schema:
              </div>
              {!userTemplate ? (
                <div className="flex flex-col items-center">
                  <div className="mb-4">
                    Enter the credentials for the account you wish to view:
                  </div>
                  <Input
                    className="mb-2"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <Input
                    className="mb-2"
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button onClick={handleLogin}>Login</Button>
                </div>
              ) : (
                <pre className="w-full p-2 overflow-auto text-sm bg-gray-100 border rounded-md border-gray-300">
                  {JSON.stringify(userTemplate, null, 2)}
                </pre>
              )}

              <div className="text-lg font-semibold mt-4">
                Make changes here:
              </div>
              {/* Add your input fields for making changes here */}
            </TabsContent>

            <TabsContent value="note" className="w-full p-3">
              <div className="text-lg font-semibold mb-2">
                This is the current schema:
              </div>
              <pre className="w-full p-2 overflow-auto text-sm bg-gray-100 border rounded-md border-gray-300">
                {JSON.stringify(noteTemplate, null, 2)}
              </pre>
              <div className="text-lg font-semibold mt-4">
                Make changes here:
              </div>
              {/* Add your input fields for making changes here */}
            </TabsContent>
          </Tabs>
        </Card>
      </ScrollArea>
    </div>
  );
}
