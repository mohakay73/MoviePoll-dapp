'use client';

import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { readContract } from '@wagmi/core';
import { abi, contractAddress } from '@/lib/abi';
import { baseSepolia } from 'viem/chains';
import { formatEther, parseEther } from 'viem';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckIcon,
  OpenInNewWindowIcon,
  PlusCircledIcon,
} from '@radix-ui/react-icons';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

export default function Home() {
  //const { address, isConnected } = useAccount();
  const { writeContract } = useWriteContract();
  const { address, isConnected } = useAccount();

  const [movies, setMovies] = useState<string[]>([]);
  const [newMovie, setNewMovie] = useState('');
  const [duration, setDuration] = useState(60);

  const addMovie = () => {
    if (newMovie.trim() && !movies.includes(newMovie.trim())) {
      setMovies([...movies, newMovie.trim()]);
      setNewMovie('');
    }
  };

  const removeMovie = (index: number) => {
    setMovies(movies.filter((_, i) => i !== index));
  };

  const startPoll = async () => {
    if (movies.length > 0) {
      try {
        const result = await writeContract({
          address: contractAddress,
          abi: abi,
          functionName: 'startPoll',
          args: [movies, BigInt(duration)],
        });
        console.log('Transaction result:', result);
      } catch (error: any) {
        console.error('Error details:', error.message);
        // Optional: Add an error notification
        alert('Failed to start poll: ' + error.message);
      }
    }
  };

  const { data: pollStatus } = useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: 'getPollStatus',
    chainId: baseSepolia.id,
  });

  const { data: remainingTime } = useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: 'getRemainingTime',
    chainId: baseSepolia.id,
  });

  const { data: currentMovies } = useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: 'getMovies',
    chainId: baseSepolia.id,
  });

  const [selectedMovie, setSelectedMovie] = useState('');

  const { writeContractAsync: vote } = useWriteContract();

  const handleVote = async () => {
    if (!selectedMovie) {
      console.log('No movie selected');
      return;
    }

    try {
      console.log('Attempting to vote for:', selectedMovie);
      const tx = await vote({
        address: contractAddress,
        abi: abi,
        functionName: 'vote',
        args: [selectedMovie],
      });
      console.log('Vote transaction:', tx);

      // Refresh vote counts
      await fetchVoteCounts();
    } catch (error: any) {
      console.error('Error voting:', error);
      alert(`Failed to vote: ${error.message}`);
    }
  };

  const [voteCounts, setVoteCounts] = useState<{ [key: string]: string }>({});

  const fetchVoteCounts = async () => {
    if (!currentMovies) return;

    const counts: { [key: string]: string } = {};
    for (const movie of currentMovies) {
      try {
        const result = await readContract({
          address: contractAddress,
          abi: abi,
          functionName: 'getVotes',
          args: [movie],
          chainId: baseSepolia.id,
        });
        counts[movie] = result?.toString() || '0';
      } catch (error) {
        console.error(`Error fetching votes for ${movie}:`, error);
        counts[movie] = '0';
      }
    }
    setVoteCounts(counts);
  };

  useEffect(() => {
    fetchVoteCounts();
  }, [currentMovies]);

  const { writeContract: endPoll } = useWriteContract();

  const handleEndPoll = async () => {
    try {
      await endPoll({
        address: contractAddress,
        abi: abi,
        functionName: 'endPoll',
      });
    } catch (error: any) {
      console.error('Error ending poll:', error);
      alert('Failed to end poll: ' + error.message);
    }
  };

  return (
    <main className="min-h-screen dark:bg-gradient-to-r dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 bg-gradient-to-b from-stone-50 to-rose-50">
      <div className="flex flex-col items-center">
        <h1 className="mt-24 lg:text-4xl sm:text-3xl text-lg">Movie Poll</h1>

        <div className="mt-4">
          <Badge
            variant={
              pollStatus === 0
                ? 'secondary'
                : pollStatus === 1
                ? 'success'
                : 'destructive'
            }
          >
            Status:{' '}
            {pollStatus === 0
              ? 'Not Started'
              : pollStatus === 1
              ? 'Voting Active'
              : pollStatus === 2
              ? 'Ended'
              : 'Unknown'}
          </Badge>
        </div>

        {pollStatus === 1 && (
          <Card className="mt-8 w-full max-w-md">
            <CardHeader>
              <CardTitle>Current Poll</CardTitle>
              <CardDescription>
                Time Remaining: {Math.floor(Number(remainingTime) / 60)} minutes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {currentMovies?.map((movie: string, index: number) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    <span>{movie}</span>
                    <Badge>{voteCounts[movie] || '0'} votes</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-12 w-full max-w-md">
          <div className="flex flex-col gap-4 items-center justify-center mt-4">
            <div className="w-full">
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Enter movie title"
                  value={newMovie}
                  onChange={(e) => setNewMovie(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addMovie()}
                />
                <Button onClick={addMovie}>Add</Button>
              </div>
              {movies.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-2">
                    Movies to vote on:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {movies.map((movie, index) => (
                      <Badge
                        key={index}
                        className="cursor-pointer"
                        onClick={() => removeMovie(index)}
                      >
                        {movie} ×
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 mb-4">
                <Input
                  type="number"
                  placeholder="Duration in minutes"
                  value={duration}
                  onChange={(e) =>
                    setDuration(Math.max(1, parseInt(e.target.value) || 1))
                  }
                />
              </div>
              <Button
                className="w-full"
                onClick={startPoll}
                disabled={movies.length === 0 || !isConnected}
              >
                <PlusCircledIcon className="mr-2" />
                Start Poll ({movies.length} movies)
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-8"></div>
      </div>

      {pollStatus === 1 && (
        <div className="mt-8 w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Active Poll</CardTitle>
              <CardDescription>
                Time remaining: {Number(remainingTime) / 60} minutes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <select
                  className="w-full p-2 rounded border"
                  value={selectedMovie}
                  onChange={(e) => setSelectedMovie(e.target.value)}
                >
                  <option value="">Select a movie</option>
                  {currentMovies?.map((movie: string, index: number) => (
                    <option
                      key={index}
                      value={movie}
                    >
                      {movie}
                    </option>
                  ))}
                </select>
                <Button
                  className="w-full"
                  onClick={handleVote}
                  disabled={!selectedMovie || !isConnected}
                >
                  <CheckIcon className="mr-2" />
                  Cast Vote
                </Button>
                {pollStatus === 1 && remainingTime === 0n && (
                  <Button
                    onClick={handleEndPoll}
                    className="mt-4 w-full"
                    variant="destructive"
                  >
                    End Poll
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {pollStatus === 2 && (
        <div className="mt-8 w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Poll Results</CardTitle>
            </CardHeader>
            <CardContent>
              {currentMovies?.map((movie: string) => (
                <div
                  key={movie}
                  className="flex justify-between py-2"
                >
                  <span>{movie}</span>
                  <Badge>{voteCounts[movie] || '0'} votes</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
