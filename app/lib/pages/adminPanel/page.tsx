"use client";
import React, { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface noteTemplate {
  [key: string]: string | Array<string> | object | boolean;
}

export default function AdminPanel() {
  const [noteTemplate, setnoteTemplate] = useState<noteTemplate | null>(null);
  const [userTemplate, setuserTemplate] = useState<noteTemplate | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const url = "http://lived-religion-dev.rerum.io/deer-lr/query";
    const contentType = "Content-Type: application/json";
    const jsonNoteBody = {
      type: "message",
      published: true,
    };
    const jsonAccountBody = {
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

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": contentType,
      },
      body: JSON.stringify(jsonAccountBody),
    })
      .then((response) => response.json())
      .then((data) => {
        const template = generateCustomTemplate(data);
        setuserTemplate(template);
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
    // get the userResponse
  };

  return (
    <div className="relative flex h-[90vh] flex-row p-4 justify-center">
      <ScrollArea>
        <div className="p-4 self-center w-full">Admin Panel</div>
        <span>
          This is the admin panel. Here you can make modifications to the
          backend schema
        </span>
        <Card className="flex flex-col items-center p-5 w-[60vw] h-[70vh]">
          <Tabs defaultValue="note" className="w-full md:w-[20vw]">
            <TabsList>
              <TabsTrigger value="note">Note Schema</TabsTrigger>
              <TabsTrigger value="account">Account Schema</TabsTrigger>
            </TabsList>

            <TabsContent value="account">
              <div>
                <div>This is the current schema:</div>
                {!userTemplate ? (
                  <div>
                    <div>
                      Enter the credentials for the account you wish to view:
                    </div>
                    <div>
                      <Input
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                      <Input
                        placeholder="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <Button onClick={handleLogin}>Login</Button>
                    </div>
                  </div>
                ) : (
                  <pre className="border-border rounded-md border-2">
                    {JSON.stringify(userTemplate, null, 2)}
                  </pre>
                )}

                <div>Make changes here:</div>
              </div>
            </TabsContent>
            <TabsContent value="note">
              <div>
                <div>This is the current schema</div>
                <pre className="border-border rounded-md border-2">
                  {JSON.stringify(noteTemplate, null, 2)}
                </pre>
                <div>Make changes here:</div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </ScrollArea>
    </div>
  );
}
