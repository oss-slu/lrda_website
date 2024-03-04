"use client";
import React, { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const RERUM_PREFIX = process.env.NEXT_PUBLIC_RERUM_PREFIX;
const paskey = process.env.NEXT_PUBLIC_ADMIN_PASKEY;

interface noteTemplate {
  [key: string]: string | Array<string> | object | boolean;
}

export default function AdminPanel() {
  const [noteTemplate, setnoteTemplate] = useState<noteTemplate | string>(
    "fetching..."
  );
  const [userTemplate, setuserTemplate] = useState<noteTemplate | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [newValue, setNewValue] = useState("");
  const [isUnlocked, setUnlocked] = useState(false);
  const [pasVal, setPasVal] = useState("");

  useEffect(() => {
    if (pasVal == paskey) {
      setUnlocked(true);
    }
  }, [pasVal]);

  useEffect(() => {
    const url = `${RERUM_PREFIX}query`;
    const contentType = "Content-Type: application/json";
    const jsonNoteBody = {
      type: "message",
      creator: "https://devstore.rerum.io/v1/id/5f284ecfe4b00e5e099907c1",
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
        console.log(data);
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
    <div className="flex flex-col justify-center w-screen p-4 py-8 overflow-auto">
      <ScrollArea className="w-full max-w-4xl self-center justify-center">
        <h1 className="text-4xl font-bold text-center">Admin Panel</h1>
        <h2 className="text-xl text-center my-4">
          This is the admin panel. Here you can make modifications to and view
          elements of the backend!
        </h2>
        <Card className="flex flex-col items-center p-5">
          {!isUnlocked ? (
            <div>
              <div className="text-lg font-semibold text-red-600">
                This page is for admins only! {"\n"}
                Enter passcode here:{" "}
              </div>

              <Input
                type="password"
                value={pasVal}
                onChange={(e) => {
                  setPasVal(e.target.value);
                }}
              />
            </div>
          ) : (
            <Tabs defaultValue="note" className="w-full">
              <div className="flex flex-row justify-center">
                <TabsList className="justify-center">
                  <TabsTrigger value="note">Note Schema</TabsTrigger>
                  <TabsTrigger value="account">Account Schema</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="account" className="w-full p-3">
                <div className="text-lg font-semibold mb-2">
                  View Account Structure here:
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
                    <Button onClick={handleLogin}>Get Structure</Button>
                  </div>
                ) : (
                  <pre className="w-full p-2 overflow-auto text-sm bg-gray-100 border rounded-md border-gray-300">
                    {JSON.stringify(userTemplate, null, 2)}
                  </pre>
                )}
              </TabsContent>

              <TabsContent value="note" className="w-full p-3">
                <div className="text-lg font-semibold mb-2">
                  This is the current schema:
                </div>
                <pre className="w-full p-2 overflow-auto text-sm bg-gray-100 border rounded-md border-gray-300">
                  {JSON.stringify(noteTemplate, null, 2)}
                </pre>

                <div className="text-lg font-semibold mt-4">
                  You can add or remove a field here, however, any change made
                  will only be reflected on the backend and will not be
                  reflected in our codebase. If you add or remove a parameter,
                  <div className="text-lg font-semibold text-red-600">
                    the code must be modified for changes to stick!
                  </div>
                </div>

                <Card className="flex flex-col items-center p-5">
                  <Tabs defaultValue="add" className="w-full">
                    <div className="flex flex-row justify-center">
                      <TabsList className="justify-center">
                        <TabsTrigger value="add">Add</TabsTrigger>
                        <TabsTrigger value="remove">Remove</TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="add">
                      <div className="flex flex-row justify-center h-12 items-center">
                        <Input
                          className="mr-4"
                          placeholder="Type the name of the new parameter"
                          value={newValue}
                          onChange={(e) => setNewValue(e.target.value)}
                        />
                        <Select>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="string">String</SelectItem>
                            <SelectItem value="boolean">Boolean</SelectItem>
                            <SelectItem value="float">Float</SelectItem>
                            <SelectItem value="stringList">
                              List of strings
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                        <AlertDialog>
                          <AlertDialogTrigger className="mt-3">
                            <Button>Submit</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Are you absolutely sure?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently add {newValue} to every single Note
                                object.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                    </TabsContent>
                    <TabsContent value="remove">
                      <div className="text-lg font-semibold mt-4 mb-5">
                        Select the parameter that you would like to permanently
                        remove!
                      </div>
                      <Select>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Parameter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="location">Location</SelectItem>
                          {/* To Do */}
                          {/* Automate a list of all parameters on the note to which can be deleted */}
                        </SelectContent>
                      </Select>
                      <AlertDialog>
                          <AlertDialogTrigger className="mt-5">
                            <Button>Submit</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Are you absolutely sure?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently add {newValue} to every single Note
                                object.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </TabsContent>
                  </Tabs>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </Card>
      </ScrollArea>
    </div>
  );
}
