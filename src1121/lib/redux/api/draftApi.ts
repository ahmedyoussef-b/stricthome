// src/lib/redux/api/draftApi.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithCredentials } from './entityApi/config';
import { ScheduleDraft } from '@/types';
import { setAllDrafts, addDraft, updateDraft as updateDraftAction, deleteDraft as deleteDraftAction, setActiveDraft } from '../features/scheduleDraftSlice';

type AllDraftsResponse = ScheduleDraft[];

export const draftApi = createApi({
    reducerPath: 'draftApi',
    baseQuery: baseQueryWithCredentials,
    tagTypes: ['Drafts'],
    endpoints: (builder) => ({
        getAllDrafts: builder.query<AllDraftsResponse, void>({
            query: () => '/api/schedule-drafts',
            providesTags: (result = []) => [
                ...result.map(({ id }) => ({ type: 'Drafts' as const, id })),
                { type: 'Drafts', id: 'LIST' },
            ],
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(setAllDrafts(data));
                } catch (error) {}
            },
        }),
        createDraft: builder.mutation<ScheduleDraft, Omit<ScheduleDraft, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'userId'>>({
            query: (draftData) => ({
                url: '/api/schedule-drafts',
                method: 'POST',
                body: draftData,
            }),
            invalidatesTags: [{ type: 'Drafts', id: 'LIST' }],
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(addDraft(data));
                } catch (error) {}
            },
        }),
        updateDraft: builder.mutation<ScheduleDraft, Partial<ScheduleDraft> & Pick<ScheduleDraft, 'id'>>({
            query: ({ id, ...patch }) => ({
                url: `/api/schedule-drafts/${id}`,
                method: 'PUT',
                body: patch,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Drafts', id }],
            async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(updateDraftAction(data));
                } catch (error) {}
            },
        }),
        deleteDraft: builder.mutation<{ success: boolean; id: string }, string>({
            query(id) {
                return {
                    url: `/api/schedule-drafts/${id}`,
                    method: 'DELETE',
                }
            },
            invalidatesTags: (result, error, id) => [{ type: 'Drafts', id }],
            async onQueryStarted(id, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                    dispatch(deleteDraftAction(id));
                } catch (error) {}
            },
        }),
        activateDraft: builder.mutation<ScheduleDraft, string>({
            query: (id) => ({
                url: `/api/schedule-drafts/${id}/activate`,
                method: 'POST',
            }),
            invalidatesTags: ['Drafts'],
        }),
    }),
});

export const {
    useGetAllDraftsQuery,
    useCreateDraftMutation,
    useUpdateDraftMutation,
    useDeleteDraftMutation,
    useActivateDraftMutation,
} = draftApi;
