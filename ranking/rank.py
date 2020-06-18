import pandas as pd
import json
import pprint

# These methods are all functional
def filter_verified(df) -> pd.DataFrame:
    return df[df['verified'] == True]

def rank_by_col(df, col: str, ascending: bool) -> pd.DataFrame:
    return df.sort_values(col, ascending=ascending)

def rank_by_lambda(df, lmbda, ascending: bool) -> pd.DataFrame:
    """ Lambda function should have a single DataFrame argument and return a Series.

    For example, `lmbda = lambda df: df.followers_count * df.friends_count`.
    """
    return df.loc[lmbda(df).sort_values(ascending=ascending).index]

if __name__ == "__main__":
    print("Running 'python ranking/test.py'")
    pd.set_option('display.max_columns', None)

    with open("fixtures/twitter-users-10k.json", "r") as read_file:
        users: list = json.load(read_file)

    cols = ["name", "screen_name", "description", "url", "followers_count", "friends_count",
            "favourites_count",  "created_at", "verified", "following", "status", "id", "id_str"]
    df = pd.DataFrame(users)[cols]
    df["created_at"] = pd.to_datetime(df["created_at"])

    print(df)
    # Filter by verified
    print("Filter verified")
    print(filter_verified(df))
    # Filter by followers
    print("By followers")
    print(rank_by_col(df, 'followers_count', ascending=False))
    # Filter by friends (someone who follows you and nobody else is likely a superfan)
    print("By friends")
    print(rank_by_col(df, 'friends_count', ascending=True))
    # Filter by favourites activity
    print("By favourites")
    print(rank_by_col(df, 'favourites_count', ascending=False))
    # Filter by follower ratio
    rank_by_lambda(df, lambda df: df.followers_count - df.friends_count, ascending=False)
    # Filter by account age
    print(rank_by_col(df, 'created_at', ascending=True))
