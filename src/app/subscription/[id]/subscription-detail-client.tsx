'use client';

import { useState } from 'react';
import { Map, MapMarker } from 'react-kakao-maps-sdk';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import dayjs from 'dayjs';
import {
  ArrowLeft,
  BookmarkPlus,
  Building2,
  Calendar,
  CalendarClock,
  Clock,
  ExternalLink,
  Eye,
  Home,
  MapPin,
  MapPinHouse,
  Pickaxe,
  School,
  Share2,
  TramFront,
  Users,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { GoogleAd } from '@/components/ui/google-ad';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useKakaoMap } from '@/hooks/useKakaoMap';

import { cn } from '@/lib/utils';

import { useDeleteLikeSubscription } from '@/services/subscription/hooks/useDeleteLikeSubscription';
import { useGetInfraBySubscription } from '@/services/subscription/hooks/useGetInfraBySubscription';
import { useGetLikeSubscriptionById } from '@/services/subscription/hooks/useGetLikeSubscriptionById';
import { useGetPriceSummary } from '@/services/subscription/hooks/useGetPriceSummary';
import { useGetSubscriptionById } from '@/services/subscription/hooks/useGetSubscriptionById';
import { usePostLikeSubscription } from '@/services/subscription/hooks/usePostLikeSubscription';
import { PriceInfoDto } from '@/services/subscription/types';

interface Props {
  id: string;
}

export default function SubscriptionDetailClient({ id }: Props) {
  const { data: getSubscriptionById } = useGetSubscriptionById(id);
  const router = useRouter();
  const params = useParams();
  const { mutate: createLike } = usePostLikeSubscription(id as string);
  const { mutate: deleteLike } = useDeleteLikeSubscription(id as string);
  const { data: getIsLike } = useGetLikeSubscriptionById(id as string);
  const subscription = getSubscriptionById?.data;
  const { data: getPriceSummary } = useGetPriceSummary(
    subscription?.region.trim() ?? '',
    subscription?.city.trim() ?? '',
    subscription?.district.trim() ?? '',
  );

  const { data: getInfraBySubscription } = useGetInfraBySubscription(id as string);
  const infra = getInfraBySubscription?.data;
  const { isMapReady, isLoading: mapLoading, error: mapError } = useKakaoMap();
  const chartConfig = {
    dealCount: {
      label: '거래건 수',
      color: '#2563eb',
      unit: '건',
    },
    pricePerAr: {
      label: '평당 가격',
      color: '#60a5fa',
      unit: '만원',
    },
  };

  const [tab, setTab] = useState<'common' | 'price' | 'chart' | 'special' | 'schedule'>('common');

  const STATUS_MAP = {
    PENDING: '대기',
    IN_PROGRESS: '진행중',
    COMPLETED: '종료',
  };

  const schedule = [
    {
      title: '모집공고',
      date: dayjs(subscription?.rceptBgnde).format('YYYY.MM.DD'),
      status: dayjs().isBefore(dayjs(subscription?.rceptBgnde))
        ? STATUS_MAP.PENDING
        : dayjs().isBefore(dayjs(subscription?.rceptEndde))
          ? STATUS_MAP.IN_PROGRESS
          : STATUS_MAP.COMPLETED,
    },
    {
      title: '특별공급',
      date: dayjs(subscription?.spsplyRceptBgnde).format('YYYY.MM.DD'),
      status: dayjs().isBefore(dayjs(subscription?.spsplyRceptBgnde))
        ? STATUS_MAP.PENDING
        : dayjs().isBefore(dayjs(subscription?.spsplyRceptEndde))
          ? STATUS_MAP.IN_PROGRESS
          : STATUS_MAP.COMPLETED,
    },
    {
      title: '1순위지역 접수',
      date: dayjs(subscription?.gnrlRnk1CrspareaRcptde).format('YYYY.MM.DD'),
      status: dayjs().isBefore(dayjs(subscription?.gnrlRnk1CrspareaRcptde))
        ? STATUS_MAP.PENDING
        : dayjs().isBefore(dayjs(subscription?.gnrlRnk1CrspareaEndde))
          ? STATUS_MAP.IN_PROGRESS
          : STATUS_MAP.COMPLETED,
    },
    {
      title: '1순위 기타지역 접수',
      date: dayjs(subscription?.gnrlRnk1EtcAreaRcptde).format('YYYY.MM.DD'),
      status: dayjs().isBefore(dayjs(subscription?.gnrlRnk1EtcAreaRcptde))
        ? STATUS_MAP.PENDING
        : dayjs().isBefore(dayjs(subscription?.gnrlRnk1EtcAreaEndde))
          ? STATUS_MAP.IN_PROGRESS
          : STATUS_MAP.COMPLETED,
    },
    {
      title: '당첨자 발표',
      date: dayjs(subscription?.przwnerPresnatnDe).format('YYYY.MM.DD'),
      status: dayjs().isBefore(dayjs(subscription?.przwnerPresnatnDe)) ? STATUS_MAP.PENDING : STATUS_MAP.COMPLETED,
    },
    {
      title: '계약',
      date: dayjs(subscription?.cntrctCnclsBgnde).format('YYYY.MM.DD'),
      status: dayjs().isBefore(dayjs(subscription?.cntrctCnclsBgnde))
        ? STATUS_MAP.PENDING
        : dayjs().isBefore(dayjs(subscription?.cntrctCnclsEndde))
          ? STATUS_MAP.IN_PROGRESS
          : STATUS_MAP.COMPLETED,
    },
  ];

  if (!subscription)
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-lg text-slate-700">청약 정보를 불러오는 중입니다...</p>
        </div>
      </div>
    );

  const isSubscriptionClosed = dayjs(subscription.rceptEndde).isBefore(dayjs());
  const daysLeft = dayjs(subscription.rceptEndde).diff(dayjs(), 'day');

  const specialSupplyCount = subscription.specialSupplyTarget.reduce(
    (acc, target) => {
      return {
        supplyCountMultichild: (acc.supplyCountMultichild || 0) + (target.supplyCountMultichild || 0),
        supplyCountNewlywed: (acc.supplyCountNewlywed || 0) + (target.supplyCountNewlywed || 0),
        supplyCountFirst: (acc.supplyCountFirst || 0) + (target.supplyCountFirst || 0),
        supplyCountYouth: (acc.supplyCountYouth || 0) + (target.supplyCountYouth || 0),
        supplyCountElderly: (acc.supplyCountElderly || 0) + (target.supplyCountElderly || 0),
        supplyCountNewborn: (acc.supplyCountNewborn || 0) + (target.supplyCountNewborn || 0),
        supplyCountInstitution: (acc.supplyCountInstitution || 0) + (target.supplyCountInstitutionRecommend || 0),
        supplyCountTransfer: (acc.supplyCountTransfer || 0) + (target.supplyCountPreviousInstitution || 0),
        supplyCountOther: (acc.supplyCountOther || 0) + (target.supplyCountOthers || 0),
        supplyCountTotal: (acc.supplyCountTotal || 0) + (target.supplyCountTotal || 0),
      };
    },
    {} as Record<string, number>,
  );

  const specialSupplyDto = [
    {
      title: '다자녀가구',
      count: specialSupplyCount.supplyCountMultichild,
    },
    {
      title: '신혼부부',
      count: specialSupplyCount.supplyCountNewlywed,
    },
    {
      title: '생애최초',
      count: specialSupplyCount.supplyCountFirst,
    },
    {
      title: '청년',
      count: specialSupplyCount.supplyCountYouth,
    },
    {
      title: '노인',
      count: specialSupplyCount.supplyCountElderly,
    },
    {
      title: '신생아',
      count: specialSupplyCount.supplyCountNewborn,
    },
    {
      title: '기관추천',
      count: specialSupplyCount.supplyCountInstitution,
    },
    {
      title: '이전기관',
      count: specialSupplyCount.supplyCountTransfer,
    },
    {
      title: '기타',
      count: specialSupplyCount.supplyCountOther,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      {/* 뒤로가기 버튼 */}
      <div className="mb-6">
        <Button
          variant="ghost"
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로 돌아가기
        </Button>
      </div>

      {/* 헤더 섹션 */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{subscription.houseNm}</h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="h-4 w-4" />
            {subscription.hssplyAdres}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-1">
            <Share2 className="h-4 w-4" />
            <span>공유하기</span>
          </Button>
          <Button
            className="gap-1 bg-blue-500 hover:bg-blue-600"
            size="sm"
            onClick={() => {
              // TODO: 로그인 여부 확인 및 예외처리
              if (getIsLike?.data) {
                deleteLike();
              } else {
                createLike();
              }
            }}
          >
            <BookmarkPlus className="h-4 w-4" />
            <span>{getIsLike?.data ? '관심 청약 해제' : '관심 청약 등록'}</span>
          </Button>
        </div>
      </div>

      {/* 지도 섹션 */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {mapError ? (
            <div className="flex h-[400px] w-full items-center justify-center rounded-xl border bg-gray-50">
              <div className="text-center text-gray-500">
                <MapPin className="mx-auto mb-2 h-8 w-8" />
                <p>{mapError}</p>
                <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
                  새로고침
                </Button>
              </div>
            </div>
          ) : mapLoading || !isMapReady ? (
            <div className="flex h-[400px] w-full items-center justify-center rounded-xl border bg-gray-50">
              <div className="text-center text-gray-500">
                <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                <p>지도 로딩 중...</p>
              </div>
            </div>
          ) : (
            <Map
              id="subscription-map"
              center={{
                lat: Number(subscription.latitude),
                lng: Number(subscription.longitude),
              }}
              className="h-full w-full rounded-xl border shadow"
              level={4}
            >
              <MapMarker
                position={{
                  lat: Number(subscription.latitude),
                  lng: Number(subscription.longitude),
                }}
                image={{
                  src: '/map-pin-house.svg',
                  size: {
                    width: 32,
                    height: 32,
                  },
                }}
              />
              {infra?.schools?.map((school, index) => (
                <MapMarker
                  key={`school-${index}`}
                  position={{
                    lat: Number(school.latitude),
                    lng: Number(school.longitude),
                  }}
                  image={{
                    src: '/school.svg',
                    size: {
                      width: 24,
                      height: 24,
                    },
                  }}
                />
              ))}
              {infra?.stations?.map((station, index) => (
                <MapMarker
                  key={`station-${index}`}
                  position={{
                    lat: Number(station.latitude),
                    lng: Number(station.longitude),
                  }}
                  image={{
                    src: '/tram-front.svg',
                    size: {
                      width: 24,
                      height: 24,
                    },
                  }}
                />
              ))}
            </Map>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {/* 청약 상태 카드 */}
          <Card className="border-2 border-blue-100 bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-blue-900">청약 상태</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">청약 기간</span>
                  <span className="text-sm text-slate-600">
                    {dayjs(subscription.rceptBgnde).format('YYYY.MM.DD')} ~{' '}
                    {dayjs(subscription.rceptEndde).format('YYYY.MM.DD')}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-blue-500" />
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-blue-600">
                      {isSubscriptionClosed ? '청약이 종료되었습니다' : `D-${daysLeft} 남았습니다`}
                    </span>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full bg-blue-500"
                        style={{
                          width: isSubscriptionClosed ? '100%' : `${Math.min(100, 100 - (daysLeft / 30) * 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-3">
              <Button
                className="w-full"
                disabled={isSubscriptionClosed}
                onClick={() => router.push(subscription.pblancUrl)}
              >
                {isSubscriptionClosed ? '청약 마감됨' : '공고 보러가기'}
              </Button>
            </CardFooter>
          </Card>

          {/* 핵심 정보 카드 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">공급 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-slate-500" />
                  <span className="text-sm text-slate-600">공급 유형</span>
                </div>
                <div className="flex gap-1">
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">{subscription.rentSecdNm}</Badge>
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">{subscription.houseDtlSecdNm}</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-500" />
                  <span className="text-sm text-slate-600">총 공급 세대수</span>
                </div>
                <span className="font-bold">{subscription.totalSupplyCountTotal || 0} 세대</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-500" />
                  <span className="text-sm text-slate-600">입주 예정</span>
                </div>
                <span className="font-bold">{subscription.priceInfo[0].moveInMonth || '미정'}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pickaxe className="h-4 w-4 text-slate-500" />
                  <span className="text-sm text-slate-600">시행사</span>
                </div>
                <span className="text-sm font-medium">{subscription.bsnsMbyNm}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-500" />
                  <span className="text-sm text-slate-600">시공사</span>
                </div>
                <span className="text-sm font-medium">{subscription.cnstrctEntrpsNm}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <Tabs defaultValue="common" className="mt-6" onValueChange={(value) => setTab(value as any)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="common">기본정보</TabsTrigger>
          <TabsTrigger value="price">가격정보</TabsTrigger>
          <TabsTrigger value="chart">실거래가 차트</TabsTrigger>
          <TabsTrigger value="special">특별공급</TabsTrigger>
          <TabsTrigger value="schedule">전체일정</TabsTrigger>
        </TabsList>

        <TabsContent value="common">
          <Card>
            <CardHeader>
              <CardTitle>기본정보</CardTitle>
              <CardDescription>공급 개요 및 주변 인프라</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="mb-3 font-medium text-slate-900">공급 개요</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-slate-600">총 세대수</span>
                        <span className="font-medium">{subscription.totalSupplyCountTotal || 0} 세대</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-slate-600">일반 공급</span>
                        <span className="font-medium">{subscription.totalSupplyCountNormal || 0} 세대</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">특별 공급</span>
                        <span className="font-medium">{subscription.totalSupplyCountSpecial || 0} 세대</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="mb-3 flex items-center gap-2 font-medium text-slate-900">
                      <School className="h-4 w-4 text-slate-900" />
                      주변 학교
                    </h3>
                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex flex-col gap-2">
                        {infra?.schools?.map((school, index) => (
                          <div key={`school-${index}`}>
                            <Badge
                              className={cn(
                                school.type === '공립' && 'bg-blue-100 text-blue-800',
                                school.type === '사립' && 'bg-orange-100 text-orange-800',
                              )}
                            >
                              {school.type}
                            </Badge>{' '}
                            {school.schoolName} <span className="text-xs text-slate-500">({school.distance}m)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="mb-3 flex items-center gap-2 font-medium text-slate-900">
                      <TramFront className="h-4 w-4 text-slate-900" />
                      주변 역
                    </h3>
                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex flex-col gap-2">
                        {infra?.stations?.map((station, index) => (
                          <div key={`station-${index}`}>
                            <Badge className={cn('bg-blue-100 text-blue-800')}>{station.line}</Badge> {station.name}{' '}
                            <span className="text-xs text-slate-500">({station.distance}m)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="price">
          <Card>
            <CardHeader>
              <CardTitle>가격정보</CardTitle>
              <CardDescription>주택 유형별 가격 및 상세 정보</CardDescription>
            </CardHeader>
            <CardContent>
              {subscription.priceInfo && subscription.priceInfo.length > 0 ? (
                <div className="space-y-6">
                  {subscription.priceInfo.map((price: PriceInfoDto, index: number) => {
                    const supplyTarget = subscription.supplyTarget.find((target) => target.id === price.id);
                    return (
                      <div className="rounded-lg border p-4" key={index}>
                        <div className="mb-4 flex items-center justify-between">
                          <h3 className="font-medium text-slate-900">{price.housingType || ''}</h3>
                          <Badge>{price.supplyPrice || subscription.totSuplyHshldco}세대</Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                          <div className="flex flex-col items-center gap-2 rounded-lg bg-slate-50 p-3">
                            <span className="text-xs text-slate-500">전용면적</span>
                            <span className="text-lg font-bold">{supplyTarget?.supplyArea || '-'} ㎡</span>
                          </div>

                          <div className="flex flex-col items-center gap-2 rounded-lg bg-slate-50 p-3">
                            <span className="text-xs text-slate-500">분양가</span>
                            <span className="text-lg font-bold">
                              {Intl.NumberFormat('ko-KR').format(price.supplyPrice) || '0'} 만원
                            </span>
                          </div>

                          <div className="flex flex-col items-center gap-2 rounded-lg bg-slate-50 p-3">
                            <span className="text-xs text-slate-500">일반 공급</span>
                            <span className="text-lg font-bold">{supplyTarget?.supplyCountNormal || 0} 세대</span>
                          </div>

                          <div className="flex flex-col items-center gap-2 rounded-lg bg-slate-50 p-3">
                            <span className="text-xs text-slate-500">특별 공급</span>
                            <span className="text-lg font-bold">{supplyTarget?.supplyCountSpecial || 0} 세대</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>실거래가 차트</CardTitle>
              <CardDescription>청약 건물 주변 실거래가 차트</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <ComposedChart
                  accessibilityLayer
                  data={[...(getPriceSummary?.data || [])].sort((a, b) => a.dealYearMonth - b.dealYearMonth)}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="dealYearMonth"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(ym) => String(ym).slice(-2) + '월'}
                  />
                  {/* 왼쪽 축: 거래 건수 */}
                  <YAxis yAxisId="left" label={{ value: '건수', angle: -90, position: 'insideLeft' }} />
                  {/* 오른쪽 축: ㎡당 가격 */}
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    label={{ value: '가격(만원)', angle: 90, position: 'insideRight' }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        labelKey="dealYearMonth"
                        indicator="line"
                        formatter={(value, name, item, index) => {
                          return (
                            <>
                              <div
                                className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[--color-bg]"
                                style={
                                  {
                                    '--color-bg': `var(--color-${name})`,
                                  } as React.CSSProperties
                                }
                              />
                              {chartConfig[name as keyof typeof chartConfig]?.label || name}
                              <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                                {value}
                                <span className="font-normal text-muted-foreground">
                                  {chartConfig[name as keyof typeof chartConfig]?.unit || ''}
                                </span>
                              </div>
                            </>
                          );
                        }}
                      />
                    }
                  />
                  {/* 막대: 거래 건수 (왼쪽 축) */}
                  <Bar yAxisId="left" dataKey="dealCount" fill="var(--color-dealCount)" radius={4} />
                  {/* 선: ㎡당 가격 (오른쪽 축) */}
                  <Line yAxisId="right" dataKey="pricePerAr" stroke="var(--color-pricePerAr)" />
                </ComposedChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="special">
          <Card>
            <CardHeader>
              <CardTitle>특별공급</CardTitle>
              <CardDescription>특별공급 정보 및 자격요건</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border p-6">
                <h3 className="mb-4 text-lg font-medium">특별공급 세대수</h3>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {specialSupplyDto.map((special) => {
                    if (special.count <= 0) return null;
                    return (
                      <div className="flex flex-col items-center gap-2 rounded-lg bg-slate-50 p-4" key={special.title}>
                        <span className="text-sm text-slate-600">{special.title}</span>
                        <span className="text-2xl font-bold text-blue-600">{special.count}</span>
                        <span className="text-xs text-slate-400">세대</span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 rounded-lg border p-4">
                  <h3 className="mb-4 text-lg font-medium">자격요건 안내</h3>
                  <p className="text-sm text-slate-600">
                    특별공급 신청자격 및 당첨자 선정방법 등 구체적인 사항은 공고문을 통해 반드시 확인하시기 바랍니다.
                  </p>
                  <div className="mt-4">
                    <Button variant="outline">
                      <Link href={subscription.pblancUrl} target="_blank" className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        특별공급 공고문 확인하기
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>전체일정</CardTitle>
              <CardDescription>청약부터 계약까지 주요 일정을 확인하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border p-6">
                <div className="space-y-6">
                  {schedule.map((item, index) => (
                    <div key={item.title} className="flex items-start gap-6 border-b pb-4 last:border-0">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          item.status === STATUS_MAP.PENDING ? 'bg-slate-100 text-slate-500' : 'bg-blue-500 text-white'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                          <h3 className="font-medium">{item.title}</h3>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-600">{item.date}</span>
                            {item.status && (
                              <Badge
                                className={cn(
                                  item.status === STATUS_MAP.PENDING && 'bg-slate-100 text-slate-500',
                                  item.status === STATUS_MAP.IN_PROGRESS && 'bg-blue-100 text-blue-800',
                                  item.status === STATUS_MAP.COMPLETED && 'bg-gray-100 text-gray-800',
                                )}
                              >
                                {item.status}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="mt-2 text-sm text-slate-500">
                          {item.title === '모집공고' && '청약 신청 조건 및 주택 정보 확인이 가능합니다.'}
                          {item.title === '특별공급' && '다자녀, 신혼부부 등 특별공급 신청일입니다.'}
                          {item.title === '1순위지역 접수' && '해당 지역 1순위 청약 신청일입니다.'}
                          {item.title === '1순위 기타지역 접수' && '기타지역 1순위 청약 신청일입니다.'}
                          {item.title === '당첨자 발표' && '청약 당첨자 발표 및 동호수 배정일입니다.'}
                          {item.title === '계약' && '분양계약 체결 기간입니다.'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* 광고 섹션 */}
      <GoogleAd adSlot="2036226073" className="mx-auto max-w-4xl" />
    </div>
  );
}
