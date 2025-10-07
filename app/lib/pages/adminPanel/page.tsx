"use client";
import React, { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import {
  getTestNote,
  handleAddParameter,
  handleLogin,
  handleRemoveParameter,
  handleAddUid,
  handleUpdateCreatorUid,
} from "../../utils/admin_utils";
import { Progress } from "@/components/ui/progress";
import { EnableAboutPageButton, DisableAboutPageButton } from "../aboutPage/AboutPageFlagButton";

const RERUM_PREFIX = process.env.NEXT_PUBLIC_RERUM_PREFIX;
const paskey = process.env.NEXT_PUBLIC_ADMIN_PASKEY;

interface noteTemplate {
  [key: string]: string | Array<string> | object | boolean;
}
const oldIdnewIdDictionary: { [key: string]: string } = {
  "https://devstore.rerum.io/v1/id/642d9fdf2e224e81da07cb01": "aadjLM3LH3MZSQmRq2FMdautGI82",
  "https://devstore.rerum.io/v1/id/645a6dc3b9ec8aaf4e9a308a": "aG4KGc3D3EbjdlGDH24YcYOLyLD3",
  "https://devstore.rerum.io/v1/id/64b2e52be82876ea1e049298": "SRRNpVqmGiasJoarjxtM8eC7Bbn2",
  "https://devstore.rerum.io/v1/id/6504d774ee7021a5f6a454cd": "DOmjrfbhgJNvKnki4wGWS5N8BFi1",
  "https://devstore.rerum.io/v1/id/6504d70a0a269d63c513df17": "PvEZzSDrbhbJTA5g8LQK9e38ISX2",
  "https://devstore.rerum.io/v1/id/6504d7a7032ea0f00165d454": "AI3YMLOZpiNGcs22YkfNgNzFQj22",
  "https://devstore.rerum.io/v1/id/6564dd74be20181027f0db82": "sTXs6aBGKlNzlk5CfhsXCbOPvoK2",
  "https://devstore.rerum.io/v1/id/65663e006d6aec4f5f2a91a5": "09RHDmnZToYDW5Rt7ZI7i8mPtVj1",
  "https://devstore.rerum.io/v1/id/6573826bbe20181027f0db93": "uKx15QYCIkhtMkNc3HIu0Z44myw1",
  "https://devstore.rerum.io/v1/id/65a6e05143b20ebe2fa2f75c": "OcjeIuaYaRSDYrizj6f4o9dP6Fo2",
  "https://devstore.rerum.io/v1/id/65b13124719d8bd8cc243ed1": "STHnk0NIS2TapvUjpqZlXzyrNaG3",
  "https://devstore.rerum.io/v1/id/65a6fed5719d8bd8cc243ec6": "rWepOGNsgHW6NEatpfxV6J9tEPf1",
  "https://devstore.rerum.io/v1/id/5da75981e4b07f0c56c0f7f9": "GHbBIu64WxOyYeHEopSZNvA69EQ2",
  "https://devstore.rerum.io/v1/id/5da759b6e4b07f0c56c0f7fb": "KqHUmUovLfP0eruRHyiJLCwacti2",
  "https://devstore.rerum.io/v1/id/65b03c6743b20ebe2fa2f76c": "9qe6Q5Ckxbhc5jnbxvk679rdMu52",
  "https://devstore.rerum.io/v1/id/65a96996fb5485efa1c389c5": "6UPRVmR0aJgdQlNvx56YrrZwUvE2",
  "https://devstore.rerum.io/v1/id/65d7a71bf53d3372e0845955": "h5IM6ZhPGxVEAdSpwywH4C1OZLB2",
  "https://devstore.rerum.io/v1/id/65ea20c2f53d3372e08459f0": "ZYouAj3fibV6R2Oiz64Wx8loGVp1",
  "https://devstore.rerum.io/v1/id/65e1068e5d508d3d84952179": "8MJGf0MotjfzDK2swiVF5NymqUU2",
  "https://devstore.rerum.io/v1/id/65ea22c1f53d3372e08459f1": "QBPqEUUjBqMNafLwDSpNV5XIH1S2",
  "https://devstore.rerum.io/v1/id/65eb49c1ce3cc6a72dfc36f3": "hF6KhkhO69OWKTvka59ZILAmnox1",
  "https://devstore.rerum.io/v1/id/65ef5fd45d508d3d84952363": "6ZqvcIG3sLQzpuExn7UsB1QWDQh2",
  "https://devstore.rerum.io/v1/id/65efd3601d442f7c715c9dfc": "g7QhEgOJj6Vh2UG29mK95iNbu8r2",
  "https://devstore.rerum.io/v1/id/65ef33f6f53d3372e0845b83": "17LaeBb0tZMYm8xOCQ9CY3jnLMz2",
  "https://devstore.rerum.io/v1/id/5ef61cf1e4b0173d8e46b085": "bAn8wMHQkxULXFiaIESHA85lhZs2",
  "https://devstore.rerum.io/v1/id/660ed93f9d6b2fadf0c70a45": "FVOLhK9eKyVZu3905kaVQtWJ39r2",
  "https://devstore.rerum.io/v1/id/65ef1999f53d3372e0845b82": "SuDSzOxvQQQLebiWkuzuVjM8Dpp1",
  "https://devstore.rerum.io/v1/id/655d1a96be20181027f0db7f": "ETt5a1VB6sWJQWfcOtzLzbEhNmf2",
  "https://devstore.rerum.io/v1/id/5da75974e4b07f0c56c0f7f7": "OH1utgr2BKSojnHk3zaLBXxse4Z2",
  "https://devstore.rerum.io/v1/id/65566cc8d73f66690abe9509": "to6gNGICQ1X1EHBDN6KQVeykKas2",
  "https://devstore.rerum.io/v1/id/662141bbe8afc731e3b58d4f": "82uXzz8ecbYyun09qaAS6uCVxDo1",
  "https://devstore.rerum.io/v1/id/66213f85a1162cbdb9d3496b": "T7rX7Feh4SZv6u9GddNHeUE0AYr2",
  "https://devstore.rerum.io/v1/id/65566f0fbe20181027f0db74": "xO2tXGVP1MSStq94FRODc7YkBfX2",
  "https://devstore.rerum.io/v1/id/65550933c8758d146d428892": "mvYjmNueigWqx1hs4tP3RvX7IUG2",
  "https://devstore.rerum.io/v1/id/66214004496553f03ae35c40": "0IoJv5zzMePTWNEQdPZSAc4S6VA3",
  "https://devstore.rerum.io/v1/id/65566db56d6aec4f5f2a919a": "jL5axK6ezxen4EPLU2fxDQuq0Ty2",
  "https://devstore.rerum.io/v1/id/662140a5e8afc731e3b58d4e": "ZC3T5W1YzfWL60TcVJFsosMNctW2",
  "https://devstore.rerum.io/v1/id/65720fe4c8758d146d4288b4": "V4eJvR8Ef1eKbbZwhpjRURfHWlm1",
  "https://devstore.rerum.io/v1/id/66213ecde8afc731e3b58d4c": "DkS4SxrWiXbjwLlEhmAwPFda8zE2",
  "https://devstore.rerum.io/v1/id/65566f926d6aec4f5f2a919c": "QLzutEofUsO5JNKCsMdZSNGFZ0P2",
  "https://devstore.rerum.io/v1/id/66214200a1162cbdb9d3496e": "UqxsMWCDC5goH5olMTLholA0VID2",
  "https://devstore.rerum.io/v1/id/65df6e0cce3cc6a72dfc368a": "tvVy2wKyaNbQvdDzS0g6KfaEDen2",
  "https://devstore.rerum.io/v1/id/6572100abe20181027f0db8d": "gqwlQnZynZWYzmfAbhJ5X10fZC32",
  "https://devstore.rerum.io/v1/id/662138a0496553f03ae35c3e": "CIosxqNI64Q7tcOsm1uxEO5jXC93",
  "https://devstore.rerum.io/v1/id/6621401f5cc3848690279e89": "wl1oaTxxEqOl031SgMrstHHSMXC2",
  "https://devstore.rerum.io/v1/id/66213f5c5cc3848690279e88": "wQuX42m58oM65OP2GTRSmsNiP6B2",
  "https://devstore.rerum.io/v1/id/65566d4bbe20181027f0db73": "J1xgpBV5OKhOkifo1hTWAcALXzN2",
  "https://devstore.rerum.io/v1/id/662138dda1162cbdb9d3496a": "ruw5FbHcjmMnx1dk04FQRDhhzDN2",
  "https://devstore.rerum.io/v1/id/66214214e8afc731e3b58d50": "8jexvHJItvNaHAxMeDDWR9UsUOO2",
  "https://devstore.rerum.io/v1/id/65566bf16d6aec4f5f2a9198": "te1OSA8R3XSTJx4CjbuyAng5kUS2",
  "https://devstore.rerum.io/v1/id/6621416aa1162cbdb9d3496d": "vmuq9jrqtNXhpsdMmp1ymVYTjQc2",
  "https://devstore.rerum.io/v1/id/65566d6ac8758d146d42889c": "Olyk0i1Ih4Z6tHuWNDFoLIlMPTj2",
  "https://devstore.rerum.io/v1/id/653a7564531a39ad9f16fbd1": "3nncka9IAkOdZkYY3frAZb2qWOB3",
  "https://devstore.rerum.io/v1/id/65566f73d73f66690abe950c": "Ct3NKIBgHhYBQZYMjzgv7eFJfNt2",
  "https://devstore.rerum.io/v1/id/66213fb6e8afc731e3b58d4d": "oT1fOMY419XCG9TcyJ9uzDKvcsJ2",
  "https://devstore.rerum.io/v1/id/66214109496553f03ae35c41": "RT91AVzim7RRcg23SsIYOtWBQJ83",
  "https://devstore.rerum.io/v1/id/66213f3a496553f03ae35c3f": "8czdLIBbW7Wr32KM4GgAsFs1l6F3",
  "https://devstore.rerum.io/v1/id/662141265cc3848690279e8a": "SPLK65Jo68dpgZOCvHpvFcGX0go2",
  "https://devstore.rerum.io/v1/id/6621384da1162cbdb9d34969": "Wrvc1jGIiAcGJnj0LahdSgcCEyH3",
  "https://devstore.rerum.io/v1/id/662138c05cc3848690279e87": "jUObHJxVmBS2V7lTpMVt8ZkrltC3",
  "https://devstore.rerum.io/v1/id/657210806d6aec4f5f2a91b4": "9gxEVuZMj9hYTwT73ciulk4eVzA2",
  "https://devstore.rerum.io/v1/id/5da75942e4b07f0c56c0f7f3": "8H86gZYSFIRHGy8q39OgBAfQFeC2",
  "https://devstore.rerum.io/v1/id/662141d0496553f03ae35c42": "F9PYL1B1L8VwDllARwcSTpBDCkY2",
  "https://devstore.rerum.io/v1/id/65720fb1d73f66690abe9523": "IP0ariWjZ2gcDCGHDn7jmvHifwn2",
  "https://devstore.rerum.io/v1/id/65566bc3d73f66690abe9508": "KHAHfSWMJ6SshJHmk81TXGOPUzI3",
  "https://devstore.rerum.io/v1/id/65566ca2c8758d146d42889b": "hf1wUbwvRngTBThmEGaRRKakQFb2",
  "https://devstore.rerum.io/v1/id/6621422a496553f03ae35c43": "oc3lPN32RnZ8e09LALGN7Mo1BcA2",
  "https://devstore.rerum.io/v1/id/66214037a1162cbdb9d3496c": "YvBuEOdCUeaEsSChsWdeAphjh5C2",
  "https://devstore.rerum.io/v1/id/65566e0ec8758d146d42889d": "d2v7JCxLlFT9jkQlvayOD4Z3HAL2",
  "https://devstore.rerum.io/v1/id/65566f37c8758d146d42889e": "OiuTJMNdDHekbRjIv4A58qpXJTV2",
  "https://devstore.rerum.io/v1/id/662141e65cc3848690279e8b": "w63WlxJTUtdpF1V7V6oQYXsxHmm1",
  "https://devstore.rerum.io/v1/id/65566d276d6aec4f5f2a9199": "vgjMNKc6GKX22Qzca9tdHembZK82",
  "https://devstore.rerum.io/v1/id/65721056c8758d146d4288b5": "DhxYnDMWYkZUpb1QT1ktYiIGGt03",
  "https://devstore.rerum.io/v1/id/642d9f642e224e81da07cb00": "mPpZp21UPnZSqevTcExeLXCxhfP2",
  "https://devstore.rerum.io/v1/id/65b7daaf8b7e984b4e75b464": "2lguaY624ERMwo26gfjghOWoDNk1",
  "https://devstore.rerum.io/v1/id/65b4175afb5485efa1c389d7": "m5zMmy4slFNMTuX7a4kn6hIFumX2",
  "https://devstore.rerum.io/v1/id/65cbd5155d508d3d84952124": "2jfv3KjFKsdJsvQYKOC4cEmp67f1",
  "https://devstore.rerum.io/v1/id/65cfb344f53d3372e084594b": "ASXpVD2VxicLfx2bne9nbjb6FDx2",
  "https://devstore.rerum.io/v1/id/65c4f57ece3cc6a72dfc3623": "TVtEoypsz4V44iHBbLFFov0nQHs2",
  "https://devstore.rerum.io/v1/id/65baa9c91d442f7c715c9b8b": "ksQBkVMKbGOonzkWEJpw4ib1Iz82",
  "https://devstore.rerum.io/v1/id/65ef34165d508d3d84952362": "YE6f3GtDHSTeye9b7rvKPGDjfkD2",
};
export default function AdminPanel() {
  const [noteTemplate, setnoteTemplate] = useState<noteTemplate | string>("fetching...");
  const [userTemplate, setuserTemplate] = useState<noteTemplate | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [newValue, setNewValue] = useState("");
  const [progress, setProgress] = useState(0.0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [newValueType, setNewValueType] = useState("");
  const [deleteValue, setDeleteValue] = useState("");
  const [isUnlocked, setUnlocked] = useState(false);
  const [pasVal, setPasVal] = useState("");

  const [oldRerumId, setOldRerumId] = useState("");
  const [newFirebaseId, setNewFirebaseId] = useState("");

  useEffect(() => {
    if (pasVal == paskey) {
      setUnlocked(true);
    }
  }, [pasVal]);

  async function fetchDataAndUpdateState() {
    const data = await getTestNote();
    if (data) {
      const template = generateCustomTemplate(data);
      setnoteTemplate(template);
    }
    setRefreshKey(refreshKey + 1);
  }

  useEffect(() => {
    fetchDataAndUpdateState();
  }, []);

  function generateCustomTemplate(dataArray: any[]): noteTemplate {
    const template: noteTemplate = {};
    if (dataArray && dataArray.length > 0) {
      const item = dataArray[0];
      Object.keys(item).forEach((key) => {
        const value = item[key];
        if (Array.isArray(value)) {
          const elementType = value.length > 0 ? typeof value[0] : "unknown";
          template[key] = elementType === "object" ? "[object array]" : `[${elementType} array]`;
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

  const handleSubmit = async (oldRerumId: string, newFirebaseId: string) => {
    try {
      const response = await handleAddUid(oldRerumId, newFirebaseId);
      if (response.ok) {
        alert("UID added successfully.");
      } else {
        alert("Failed to add UID.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred.");
    }
  };

  const updateAllUids = async () => {
    for (const oldRerumId in oldIdnewIdDictionary) {
      const newFirebaseId = oldIdnewIdDictionary[oldRerumId];
      console.log(`Updating UID for ${oldRerumId} to ${newFirebaseId}`);
      await handleAddUid(oldRerumId, newFirebaseId);
    }
    alert("All UIDs updated successfully.");
  };

  const handleUpdateCreator = async (oldRerumId: string, newFirebaseId: string) => {
    try {
      const response = await handleUpdateCreatorUid(oldRerumId, newFirebaseId);
      response.forEach((result) => {
        console.log(`Note ${result.noteId}: ${result.status} (${result.statusText || result.error})`);
      });
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred.");
    }
  };

  const updateAllCreators = async () => {
    for (const oldRerumId in oldIdnewIdDictionary) {
      const newFirebaseId = oldIdnewIdDictionary[oldRerumId];
      console.log(`Updating creator for ${oldRerumId} to ${newFirebaseId}`);
      await handleUpdateCreator(oldRerumId, newFirebaseId);
    }
  };

  return (
    <div className="flex flex-col justify-center w-screen p-4 py-8 overflow-auto">
      <ScrollArea className="w-full max-w-4xl self-center justify-center">
        <h1 className="text-4xl font-bold text-center">Admin Panel</h1>
        <h2 className="text-xl text-center my-4">
          This is the admin panel. Here you can make modifications to and view elements of the backend!
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
                  <TabsTrigger value="uid">Add UID</TabsTrigger>
                  <TabsTrigger value="updateCreator">Update Creator UID</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="account" className="w-full p-3">
                <div className="text-lg font-semibold mb-2">View Account Structure here:</div>
                {!userTemplate ? (
                  <div className="flex flex-col items-center">
                    <div className="mb-4">Enter the credentials for the account you wish to view:</div>
                    <Input className="mb-2" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                    <Input
                      className="mb-2"
                      placeholder="Password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button
                      onClick={() => {
                        (async () => {
                          try {
                            const userTemplateData = await handleLogin(username, password);
                            setuserTemplate(userTemplateData);
                          } catch (error) {
                            console.error("Login failed:", error);
                          }
                        })();
                      }}
                    >
                      Get Structure
                    </Button>
                  </div>
                ) : (
                  <pre className="w-full p-2 overflow-auto text-sm bg-gray-100 border rounded-md border-gray-300">
                    {JSON.stringify(userTemplate, null, 2)}
                  </pre>
                )}
              </TabsContent>

              <TabsContent value="note" className="w-full p-3">
                <div className="text-lg font-semibold mb-2">This is the current schema:</div>
                <pre key={refreshKey} className="w-full p-2 overflow-auto text-sm bg-gray-100 border rounded-md border-gray-300">
                  {JSON.stringify(noteTemplate, null, 2)}
                </pre>

                <div className="text-lg font-semibold mt-4">
                  You can add or remove a field here, however, any change made will only be reflected on the backend and will not be
                  reflected in our codebase. If you add or remove a parameter,
                  <div className="text-lg font-semibold text-red-600">the code must be modified for changes to stick!</div>
                </div>
                {progress == 0 || progress == 100 ? null : (
                  <div className="mt-5">
                    <div className="text-lg font-semibold text-red-600">Do NOT close this tab until this script is complete!</div>
                    <Progress value={progress} />
                  </div>
                )}
                <Card className="flex flex-col items-center p-5 mt-5">
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
                        <Select
                          onValueChange={(val) => {
                            setNewValueType(val);
                          }}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="string">String</SelectItem>
                            <SelectItem value="boolean">Boolean</SelectItem>
                            <SelectItem value="float">Float</SelectItem>
                            <SelectItem value="array">Array</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger className="mt-3">
                          <Button>Submit</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently add {newValue} as a/an {newValueType} to every single Note
                              Object.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={async () => {
                                console.log(`should attempt to delete ${newValue} as a/an ${newValueType}`);
                                await handleAddParameter(newValue, newValueType, setProgress);
                                fetchDataAndUpdateState();
                              }}
                            >
                              Continue
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TabsContent>
                    <TabsContent value="remove">
                      <div className="text-lg font-semibold mt-4 mb-5">Select the parameter that you would like to permanently remove!</div>
                      <Select
                        onValueChange={(val) => {
                          setDeleteValue(val);
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Parameter" />
                        </SelectTrigger>
                        <SelectContent>
                          {typeof noteTemplate === "object" &&
                            noteTemplate !== null &&
                            Object.keys(noteTemplate).map((key) => {
                              if (key !== "@id" && key !== "__rerum") {
                                return (
                                  <SelectItem key={key} value={key}>
                                    {key}
                                  </SelectItem>
                                );
                              }
                              return null;
                            })}
                        </SelectContent>
                      </Select>
                      <AlertDialog>
                        <AlertDialogTrigger className="mt-5">
                          <Button>Submit</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently remove {deleteValue} from every single Note Object.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={async () => {
                                console.log(`should attempt to delete ${deleteValue}`);
                                await handleRemoveParameter(deleteValue, setProgress);
                                fetchDataAndUpdateState();
                              }}
                            >
                              Continue
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TabsContent>
                  </Tabs>
                </Card>
                <EnableAboutPageButton />
                <DisableAboutPageButton />  
              </TabsContent>

              <TabsContent value="uid" className="w-full p-3">
                <div className="text-lg font-semibold mb-2">Add UID to Rerum ID</div>
                <Input className="mb-2" placeholder="Old Rerum ID" value={oldRerumId} onChange={(e) => setOldRerumId(e.target.value)} />
                <Input
                  className="mb-2"
                  placeholder="New Firebase ID"
                  value={newFirebaseId}
                  onChange={(e) => setNewFirebaseId(e.target.value)}
                />
                <Button onClick={() => handleSubmit(oldRerumId, newFirebaseId)}>Submit</Button>
                <Button onClick={updateAllUids} className="mt-4">
                  Update All UIDs
                </Button>
              </TabsContent>

              <TabsContent value="updateCreator" className="w-full p-3">
                <div className="text-lg font-semibold mb-2">Update Creator UID for All Notes</div>
                <Input className="mb-2" placeholder="Old Rerum ID" value={oldRerumId} onChange={(e) => setOldRerumId(e.target.value)} />
                <Input
                  className="mb-2"
                  placeholder="New Firebase ID"
                  value={newFirebaseId}
                  onChange={(e) => setNewFirebaseId(e.target.value)}
                />
                <Button onClick={() => handleUpdateCreator(oldRerumId, newFirebaseId)}>Submit</Button>
                <Button onClick={updateAllCreators} className="mt-4">
                  Update All Creators
                </Button>
              </TabsContent>
            </Tabs>
          )}
        </Card>
      </ScrollArea>
    </div>
  );
}
