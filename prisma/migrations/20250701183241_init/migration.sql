-- CreateTable
CREATE TABLE "Prompt" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "text" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Users" (
    "id" TEXT NOT NULL,
    "username" VARCHAR(120) NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsersRelationProfiles" (
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "username" TEXT NOT NULL,

    CONSTRAINT "UsersRelationProfiles_pkey" PRIMARY KEY ("userId","platform","username")
);

-- CreateTable
CREATE TABLE "UsersRelationHashtag" (
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "UsersRelationHashtag_pkey" PRIMARY KEY ("userId","platform","tag")
);

-- CreateTable
CREATE TABLE "Profiles" (
    "platform" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "profilePic" TEXT,
    "profileBio" TEXT,
    "followers" INTEGER,
    "following" INTEGER,
    "latestVideo" TEXT,
    "comments" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "public" BOOLEAN DEFAULT true,

    CONSTRAINT "Profiles_pkey" PRIMARY KEY ("platform","username")
);

-- CreateTable
CREATE TABLE "Posts" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "searchType" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "hashtag" TEXT,
    "url" TEXT,
    "caption" TEXT,
    "postType" TEXT,
    "takenAt" TIMESTAMP(3),
    "likes" BIGINT,
    "videoPlayCount" BIGINT,
    "comments" BIGINT,
    "durationSec" DOUBLE PRECISION,
    "raw" JSONB,
    "timestamp" TIMESTAMP(3),
    "isTemplate" BOOLEAN DEFAULT false,
    "scrapedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hashtag" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "firstSeen" TIMESTAMP(3),
    "totalPosts" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hashtag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestHistory" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "videoUrl" TEXT,
    "videoData" JSONB,
    "originalScript" TEXT,
    "promptId" TEXT,
    "result" TEXT NOT NULL,
    "processingTime" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'success',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Hashtag_platform_tag_key" ON "Hashtag"("platform", "tag");

-- AddForeignKey
ALTER TABLE "RequestHistory" ADD CONSTRAINT "RequestHistory_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
