import express from "express";
import cors from 'cors';

import { PrismaClient } from "@prisma/client";


const app = express();

app.use(express.json());

app.use(cors())

const prisma = new PrismaClient({
  log: ["query"],
});

app.get("/games", async (resquest, response) => {
  const games = await prisma.game.findMany({
    include: {
      _count: {
        select: {
          ads: true,
        },
      },
    },
  });

  return response.json(games);
});


function convertHourStringToMinutes(hourString: string) {
  const [hours, minutes] = hourString.split(":").map(Number);

  const minutesAmount = hours * 60 + minutes;

  return minutesAmount;
}

function convertMinutesHourStringTo(minutesAmount: number) {
  const hours = Math.floor(minutesAmount / 60);
  const minutes = minutesAmount %60;

  return`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

app.post("/games/:gamesId/ads", async (request, response) => {
  const gameId = request.params.gamesId;

  const body: any = request.body;

  const ad = await prisma.ad.create({
   data: {
    gameId,
    name: body.name,
    yearsPlaying: body.yearsPlaying,
    weekDays: body.weekDays.join(','),
    hourStart: convertHourStringToMinutes(body.hourStart),
    discord: body.discord,
    hourEnd: convertHourStringToMinutes(body.hourEnd),
    useVoiceChannel: body.useVoiceChannel,    
   }
  })

  return response.status(201).json(ad);
});

app.get("/games/:id/ads", async (request, response) => {
  const gameId = request.params.id;

  const ads = await prisma.ad.findMany({
    select: {
      id: true,
      name: true,
      yearsPlaying: true,
      weekDays: true,
      hourStart: true,
      discord: true,
      hourEnd: true,
      useVoiceChannel: true,
    },
    where: {
      gameId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return response.json(
    ads.map((ad) => {
      return {
        ...ad,
        weekDays: ad.weekDays.split(","),
        hourStart: convertMinutesHourStringTo(ad.hourStart),
        hourEnd: convertMinutesHourStringTo(ad.hourEnd)
      };
    })
  );
});

app.get("/ads/:id/discord", async (request, response) => {
  const adId = request.params.id;

  const ad = await prisma.ad.findFirstOrThrow({
    select: {
      discord: true,
    },
    where: {
      id: adId,
    },
  });

  return response.json({
    discord: ad.discord,
  });
});

app.listen(3333);
