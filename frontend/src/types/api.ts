export type ApiSuccess<T> = {
  statusCode: number;
  data: T;
  message: string;
  success: true;
};

export type ApiErrorBody = {
  statusCode: number;
  data: null;
  message: string;
  success: false;
  errors?: string[];
  errorCode?: string;
  requestId?: string;
};

export type Paginated<T> = {
  results: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type User = {
  _id: string;
  username: string;
  email: string;
  fullname: string;
  avatar: string;
  coverImage?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ChannelProfile = {
  _id: string;
  username: string;
  fullname: string;
  avatar: string;
  coverImage?: string;
  email?: string;
  subscriberCount: number;
  channelsubscribedToCount: number;
  isSubscribed: boolean;
};

export type VideoOwner = {
  _id: string;
  username: string;
  fullname: string;
  avatar: string;
};

export type Video = {
  _id: string;
  videoFile: string;
  thumbnail: string;
  owner: string | VideoOwner;
  title: string;
  description: string;
  duration: number;
  views: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type LoginResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export type Comment = {
  _id: string;
  content: string;
  video: string;
  owner: string | VideoOwner;
  createdAt: string;
  updatedAt: string;
};

export type Playlist = {
  _id: string;
  name: string;
  description: string;
  videos: string[] | Video[];
  owner: string | VideoOwner;
  createdAt: string;
  updatedAt: string;
};

export type Tweet = {
  _id: string;
  content: string;
  owner: string | VideoOwner;
  createdAt: string;
  updatedAt: string;
};

export type DashboardStats = {
  totalVideos: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalSubscribers: number;
};

export type Like = {
  _id: string;
  video?: string;
  comment?: string;
  tweet?: string;
  likedBy: string;
  createdAt?: string;
};

export type Subscription = {
  _id: string;
  subscriber: string | VideoOwner;
  channel: string | VideoOwner;
  createdAt?: string;
};

export type WatchHistoryItem = Video;

export type VideoLikeState = {
  liked: boolean;
  likes: number | null;
};

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";
