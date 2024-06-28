import {fetchQueryWithPagination} from "@airstack/node";

interface Cast {
  text: string;
  hash: string;
  socialCapitalValue: {
    formattedValue: number;
  };
  channel: {
    channelId: string | null;
  };
  numberOfLikes: number;
  numberOfRecasts: number;
  numberOfReplies: number;
}

interface PageInfo {
  hasNextPage: boolean;
  nextCursor: string | null;
}

const fetchUserCasts = async (username: string): Promise<Cast[]> => {
  let allCasts: Cast[] = [];
  let currentPageCursor = "";
  let hasNextPage = true;

  const formattedUsername = `fc_fname:${username}`;

  while (hasNextPage) {
    const query = `
      query GetCastsByUsername($username: Identity!, $cursor: String) {
        FarcasterCasts(
          input: {filter: {castedBy: {_eq: $username}}, blockchain: ALL, limit: 200, cursor: $cursor}
        ) {
          Cast {
            text
            hash
            socialCapitalValue {
              formattedValue
            }
            channel {
              channelId
            }
            numberOfLikes
            numberOfRecasts
            numberOfReplies
          }
          pageInfo {
            hasNextPage
            nextCursor
          }
        }
      }
    `;

    const variables = {
      username: formattedUsername,
      cursor: currentPageCursor,
    };

    try {
      const {data, error} = await fetchQueryWithPagination(query, variables);
      if (error) {
        console.error(`Fetching casts failed with error: ${JSON.stringify(error)}`);
        throw new Error(`Fetching casts failed: ${JSON.stringify(error, null, 2)}`);
      }

      allCasts = allCasts.concat(data.FarcasterCasts.Cast);
      const pageInfo: PageInfo = data.FarcasterCasts.pageInfo;
      hasNextPage = pageInfo.hasNextPage;
      currentPageCursor = pageInfo.nextCursor || "";
    } catch (err) {
      console.error(`Error during fetching casts: ${err}`);
      throw err;
    }
  }

  return allCasts;
};

export {fetchUserCasts};
