"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import YouTube from "react-youtube";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Appbar } from "@/components/Appbar";
import SpotifyPlayer from "react-spotify-player";
import { useToast } from "@/hooks/use-toast";
import { TrashIcon } from "lucide-react";
import ShareComponent from "@/components/share";

interface Space {
  id: string;
  name: string;
  description: string;
  author: string;
  authorId: string;
}

interface Stream {
  id: string;
  title: string;
  extractedurl: string;
  url: string;
}
interface upvote{
    upvotes:number
}

const DashboardPage: React.FC = () => {
  const { data: session } = useSession();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [currentSpace, setCurrentSpace] = useState<Space | null>(null);
  const [newSongUrl, setNewSongUrl] = useState<string>("");
  const [isCreator, setIsCreator] = useState<boolean>(false);
  const [currentSong, setCurrentSong] = useState<Stream | null>(null);
  const [queue, setQueue] = useState<Stream[]>([]);
  const playerRef = useRef<YouTube>(null);
  const [newSpaceName, setNewSpaceName] = useState<string>("");
  const [newSpaceDescription, setNewSpaceDescription] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  const [upvote,setUpvote] = useState<upvote | number>(0);

  const { toast } = useToast();

  useEffect(() => {
    fetchSpaces();
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedSpaceId = urlParams.get("spaceId");
    if (sharedSpaceId) {
      const space = spaces.find((s) => s.id === sharedSpaceId);
      if (space) {
        joinSpace(space);
      }
    }
  }, [spaces]);

  useEffect(() => {
    if (currentSpace) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [currentSpace]);

  const startPolling = useCallback(() => {
    if (pollInterval) {
      clearInterval(pollInterval);
    }
    const interval = setInterval(() => {
      if (currentSpace) {
        fetchStreams(currentSpace.id);
      }
    }, 5000); // Poll every 5 seconds
    setPollInterval(interval);
  }, [currentSpace]);

  const stopPolling = useCallback(() => {
    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
  }, [pollInterval]);

  const fetchSpaces = async () => {
    try {
      const response = await axios.get<{ spaces: Space[] }>(
        "/api/create/space"
      );
      setSpaces(response.data.spaces || []);
    } catch (error) {
      console.error("Failed to fetch spaces:", error);
      setError("Failed to fetch spaces. Please try again later.");
    }
  };

  const joinSpace = async (space: Space) => {
    try {
      const response = await axios.post("/api/join-space", {
        spaceId: space.id,
      });
      setCurrentSpace(space);
      setIsCreator(response.data.isCreator);
      await fetchStreams(space.id);
      startPolling();
      toast({
        title: "Space Joined",
        description: "You have successfully joined the space.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Failed to join space",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const fetchStreams = async (spaceId: string) => {
    try {
      const response = await axios.get<{ streams: Stream[] }>(
        `/api/create/stream?spaceId=${spaceId}`
      );
      const newStreams = response.data.streams || [];

      setQueue(newStreams);
      if (
        newStreams.length > 0 &&
        (!currentSong || !newStreams.find((s) => s.id === currentSong.id))
      ) {
        setCurrentSong(newStreams[0]);
      } else if (newStreams.length === 0) {
        setCurrentSong(null);
      }
    } catch (error) {
      console.error("Failed to fetch streams:", error);
      setError("Failed to fetch streams. Please try again later.");
    }
  };

  const createStream = async () => {
    if (!newSongUrl || !currentSpace) return;

    try {
      const response = await axios.post<{ stream: Stream }>(
        "/api/create/stream",
        {
          spaceId: currentSpace.id,
          url: newSongUrl,
        }
      );
      if (response.data.stream) {
        setNewSongUrl("");
        await fetchStreams(currentSpace.id);
      }
      toast({
        title: "Song Added Successfully",
        description: "Song has been added to the queue.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Failed to add song",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const deleteStream = async () => {
    if (!currentSong || !isCreator || !currentSpace) return;

    try {
      await axios.delete("/api/delete", {
        data: {
          id: currentSong.id,
        },
      });

      await fetchStreams(currentSpace.id);

      toast({
        title: "Song Deleted",
        description: "Song has been deleted from the queue",
        variant: "default",
      });
    } catch (err) {
      toast({
        title: "Failed to delete song",
        description:
          "You don't have permission to delete this song or an error occurred.",
        variant: "destructive",
      });
    }
  };

  const createSpace = async () => {
    try {
      const response = await axios.post<{ space: Space }>("/api/create/space", {
        name: newSpaceName,
        description: newSpaceDescription,
      });
      if (response.data.space) {
        setSpaces([...spaces, response.data.space]);
        setNewSpaceName("");
        setNewSpaceDescription("");
      }
      toast({
        title: "Space Created Successfully",
        description: "Space has been created.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Failed to create space",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const deleteSpace = async()=>{
    if(!currentSpace || !isCreator) return;

    try {
      await axios.delete("/api/delete/space", {
        data: {
          id: currentSpace.id,
        },
      });

      setCurrentSpace(null);
      setSpaces(spaces.filter((space) => space.id !== currentSpace.id));

      toast({
        title: "Space Deleted",
        description: "Space has been deleted.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Space not empty",
        description: "Remove all the streams to delete the space",
        variant: "destructive",
      });
    }

  }

  const onVideoEnd = () => {
    playNext();
  };

  const upvoteSong = async () => {
    if (!currentSong) return;

    try {
      const response = await axios.post("/api/upvote", {
        streamID: currentSong.id,
      });
      setUpvote(response.data.upvotes);
      toast({
        title: "Song Upvoted",
        description: `The song now has ${response.data.upvotes} upvotes.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to upvote song:", error);
      toast({
        title: "Failed to upvote song",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const playNext = async () => {
    if (!currentSpace) return;

    if (queue.length <= 1) {
      setCurrentSong(null);
      setQueue([]);
      toast({
        title: "Queue Empty",
        description: "No more songs in the queue.",
        variant: "default",
      });
      return;
    }

    try {
      await axios.delete("/api/delete", {
        data: {
          id: queue[0].id,
        },
      });

      await fetchStreams(currentSpace.id);

      toast({
        title: "Next Song",
        description: "Playing the next song in the queue.",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to play next song:", error);
      toast({
        title: "Failed to play next song",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const isSpotifyTrack = (url: string) => {
    return url.includes("spotify.com/track/");
  };

  const renderPlayer = () => {
    if (!currentSong) return null;

    if (isSpotifyTrack(currentSong.url)) {
      const size = {
        width: "100%",
        height: 80,
      };
      const view = "list";
      const theme = "black";

      return (
        <SpotifyPlayer
          uri={`spotify:track:${currentSong.extractedurl}`}
          size={size}
          view={view}
          theme={theme}
        />
      );
    } else {
      return (
        <YouTube
          videoId={currentSong.extractedurl}
          opts={{
            width: "100%",
            height: "200",
            playerVars: { autoplay: 1 },
          }}
          onEnd={onVideoEnd}
          ref={playerRef}
        />
      );
    }
  };

  return (
    <div className="container mt-12 p-4">
      <Appbar />

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          {error}
        </div>
      )}

      {!currentSpace ? (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Available Spaces</h1>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Create New Space</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a New Space</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Input
                    placeholder="Space Name"
                    value={newSpaceName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewSpaceName(e.target.value)
                    }
                  />
                  <Input
                    placeholder="Space Description"
                    value={newSpaceDescription}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewSpaceDescription(e.target.value)
                    }
                  />
                  <Button onClick={createSpace}>Create Space</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {spaces.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {spaces.map((space) => (
                <Card
                  key={space.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => joinSpace(space)}
                >
                  <CardHeader className="flex">
                    <CardTitle className="text-lg font-semibold">
                      {space.name || "Unnamed Space"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      {space.description || "No description"}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Created by: {space.author || "Unknown"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No spaces available.</p>
          )}
        </div>
      ) : (
        <div className="mt-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">{currentSpace.name}</h2>
              <p className="text-sm text-gray-600">
                {currentSpace.description}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="destructive"
                onClick={() => setCurrentSpace(null)}
              >
                Leave Space
              </Button>
              <ShareComponent spaceId={currentSpace.id} />
            </div>
            <div>
              {isCreator && (
                <Button variant="destructive" onClick={deleteSpace}>
                  Delete Space
                </Button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    Now Playing
                    <Button
                      onClick={playNext}
                      disabled={!currentSong}
                      variant="secondary"
                    >
                      Play Next
                    </Button>
                    <Button
                      onClick={upvoteSong}
                      variant="secondary"
                    >
                      Upvotes : {JSON.stringify(upvote)}
                    </Button>
                    {isCreator && currentSong && (
                      <Button onClick={deleteStream} variant="secondary">
                        <TrashIcon />
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentSong ? (
                    <>
                      {renderPlayer()}
                      <p className="mt-4 text-lg font-semibold">
                        {currentSong.title}
                      </p>
                    </>
                  ) : (
                    <p className="text-center text-gray-500">
                      No song is playing.
                    </p>
                  )}
                </CardContent>
              </Card>
              <div className="flex items-center">
                <Input
                  type="text"
                  placeholder="Paste YouTube or Spotify URL here"
                  value={newSongUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewSongUrl(e.target.value)
                  }
                  className="flex-1 mr-2"
                />
                <Button onClick={createStream}>Add to Queue</Button>
              </div>
            </div>
            <div>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Queue</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px]">
                    {queue.length > 1 ? (
                      queue.slice(1).map((song, index) => (
                        <div
                          key={song.id}
                          className="px-4 py-2 border-b border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <p className="text-sm font-medium">{song.title}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 mt-4">
                        The queue is empty.
                      </p>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
